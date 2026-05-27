import { NextRequest, NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';

/**
 * GET /api/trades/[id]/review
 * Generate a Plotly candlestick review chart for a completed trade
 * Includes entry/exit markers, SL/TP zones, and validation details from Check #9
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tradeId } = await params;

    if (!tradeId) {
      return NextResponse.json(
        { error: 'Trade ID required' },
        { status: 400 }
      );
    }

    // 1. Fetch trade from database
    const trade = dbOps.getTradeById(tradeId);
    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // 2. Fetch validation details (Check #9) from validation_log
    const validation = dbOps.getValidationLog(tradeId);

    // 3. Generate mock OHLCV data (Capital.com API integration for real data would go here)
    // For now, generate synthetic candlestick data centered on entry price
    const entryTime = new Date(trade.created_at).getTime();
    const startTime = new Date(entryTime - 2 * 60 * 60 * 1000);
    const endTime = new Date(entryTime + 2 * 60 * 60 * 1000);

    const ohlcvData = generateMockOHLCV(
      parseFloat(trade.entry_price),
      startTime,
      endTime
    );

    // 4. Build Plotly candlestick trace
    const candleTrace = {
      x: ohlcvData.map((bar: Record<string, unknown>) => new Date((bar.time as number) * 1000).toISOString()),
      open: ohlcvData.map((bar: Record<string, unknown>) => bar.open),
      high: ohlcvData.map((bar: Record<string, unknown>) => bar.high),
      low: ohlcvData.map((bar: Record<string, unknown>) => bar.low),
      close: ohlcvData.map((bar: Record<string, unknown>) => bar.close),
      type: 'candlestick',
      name: 'OHLC',
    };

    // 5. Calculate Risk/Reward
    const entryPrice = parseFloat(trade.entry_price);
    const exitPrice = trade.exit_price ? parseFloat(trade.exit_price) : entryPrice;
    const stopPrice = parseFloat(trade.stop_price);

    const riskPips =
      trade.direction === 'long'
        ? (entryPrice - stopPrice) / 0.0001
        : (stopPrice - entryPrice) / 0.0001;

    const rewardPips =
      trade.direction === 'long'
        ? (exitPrice - entryPrice) / 0.0001
        : (entryPrice - exitPrice) / 0.0001;

    const rrRatio = Math.abs(rewardPips / riskPips);

    // 6. Create entry/exit markers
    const entryMarker = {
      x: [new Date(trade.created_at).toISOString()],
      y: [entryPrice],
      mode: 'markers+text',
      marker: { size: 15, color: trade.direction === 'long' ? 'green' : 'red' },
      text: [`ENTRY @ ${entryPrice.toFixed(5)}`],
      textposition: 'top center',
      name: 'Entry',
      type: 'scatter',
    };

    const exitMarker = trade.exit_price
      ? {
          x: [new Date(trade.exited_at || new Date()).toISOString()],
          y: [exitPrice],
          mode: 'markers+text',
          marker: { size: 15, color: rewardPips > 0 ? 'blue' : 'orange' },
          text: [`EXIT @ ${exitPrice.toFixed(5)}`],
          textposition: 'bottom center',
          name: 'Exit',
          type: 'scatter',
        }
      : null;

    // 7. Create SL/TP zone bands
    const slLine = {
      type: 'hline',
      y0: parseFloat(trade.stop_price),
      line: { color: 'red', width: 2, dash: 'dash' },
      name: `Stop Loss @ ${trade.stop_price}`,
    };

    const tpLine = trade.retap_level
      ? {
          type: 'hline',
          y0: parseFloat(trade.retap_level),
          line: { color: 'green', width: 2, dash: 'dash' },
          name: `Take Profit @ ${trade.retap_level}`,
        }
      : null;

    // 8. Build layout
    const layout = {
      title: {
        text: `Trade Review: ${trade.symbol} ${trade.direction.toUpperCase()} @ ${entryPrice.toFixed(5)}`,
        x: 0.5,
        xanchor: 'center',
      },
      xaxis: {
        title: 'Time (ADL)',
        rangeslider: { visible: false },
      },
      yaxis: {
        title: `Price (${trade.symbol})`,
      },
      hovermode: 'x unified',
      template: 'plotly_dark',
      shapes: [slLine, tpLine].filter(Boolean),
      annotations: [
        {
          text: `Risk/Reward: ${rrRatio.toFixed(2)}:1 | P&L: ${trade.pnl || 0} USD`,
          xref: 'paper',
          yref: 'paper',
          x: 0.5,
          y: -0.15,
          showarrow: false,
          xanchor: 'center',
        },
      ],
    };

    // 9. Compile response
    const data = [candleTrace, entryMarker, exitMarker].filter(Boolean);

    return NextResponse.json({
      trade_id: tradeId,
      symbol: trade.symbol,
      direction: trade.direction,
      status: trade.status,
      chart: {
        data,
        layout,
      },
      trade_metrics: {
        entry_price: entryPrice,
        exit_price: exitPrice,
        stop_loss: parseFloat(trade.stop_price),
        take_profit: trade.retap_level ? parseFloat(trade.retap_level) : null,
        risk_pips: Math.abs(riskPips),
        reward_pips: Math.abs(rewardPips),
        rr_ratio: rrRatio,
        pnl_usd: trade.pnl || 0,
        status: trade.status,
      },
      validation_check_9: validation
        ? {
            ema_aligned: validation.ema_aligned,
            vwap_confirmed: validation.price_above_vwap,
            volume_surge: validation.volume_confirmed,
            atr_valid: validation.atr_valid,
            candle_4h_valid: validation.candle_4h_valid,
            overall_valid: validation.overall_valid,
            ema10: validation.ema10,
            ema21: validation.ema21,
            vwap: validation.vwap,
            volume_ratio: validation.volume ? (validation.volume / (validation.volume_avg || 1)).toFixed(2) : null,
            atr_pips: validation.atr,
          }
        : null,
      created_at: trade.created_at,
      executed_at: trade.executed_at,
      exited_at: trade.exited_at,
    });
  } catch (error) {
    console.error('GET /api/trades/[id]/review error:', error);
    return NextResponse.json(
      { error: 'Failed to generate trade review', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate synthetic OHLCV data for chart visualization
 * (Real implementation would fetch from Capital.com API)
 */
function generateMockOHLCV(
  centerPrice: number,
  startTime: Date,
  endTime: Date
): Array<{ time: number; open: number; high: number; low: number; close: number }> {
  const bars = [];
  let currentTime = startTime.getTime();
  let currentPrice = centerPrice;

  // Generate 1-hour bars
  while (currentTime < endTime.getTime()) {
    const openPrice = currentPrice;
    const variation = (Math.random() - 0.5) * 0.0008; // ±0.0004 variation
    const closePrice = Math.max(centerPrice * 0.9999, Math.min(centerPrice * 1.0001, currentPrice + variation));
    const high = Math.max(openPrice, closePrice) + Math.random() * 0.0002;
    const low = Math.min(openPrice, closePrice) - Math.random() * 0.0002;

    bars.push({
      time: currentTime,
      open: parseFloat(openPrice.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(closePrice.toFixed(5)),
    });

    currentPrice = closePrice;
    currentTime += 60 * 60 * 1000; // 1 hour
  }

  return bars;
}

/**
 * OPTIONS /api/trades/[id]/review - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
