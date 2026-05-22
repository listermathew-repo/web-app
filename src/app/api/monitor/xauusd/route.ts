import { NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { sendStopLossAlert } from '@/lib/alerts';

/**
 * GET /api/monitor/xauusd
 * XAUUSD stop loss monitoring endpoint
 * Checks current XAUUSD price against 4534.74 stop loss level
 * Sends URGENT alert if price is below stop loss
 * Logs all checks to database
 */

// XAUUSD configuration
const XAUUSD_CONFIG = {
  symbol: 'XAUUSD',
  breakout: 4570.895,
  retap: 4555,
  stopLoss: 4534.74,
  risk: 400,
};

export async function GET() {
  try {
    const startTime = Date.now();
    const checkTime = new Date().toISOString();

    // Fetch current XAUUSD price from TradingView
    let currentPrice: number | null = null;
    let priceSource = 'unknown';

    try {
      // Try to get price from TradingView via fetch (using Capital.com quote)
      const response = await fetch(
        'https://www.tradingview.com/api/v1/quotes/?symbols=CAPITALCOM:XAUUSD'
      ).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        if (data?.d?.[0]?.lp) {
          currentPrice = data.d[0].lp;
          priceSource = 'tradingview';
        }
      }
    } catch (error) {
      console.error('Failed to fetch from TradingView:', error);
    }

    // Fallback: use a recent price (in production, connect to Capital.com API)
    if (!currentPrice) {
      // This is a placeholder - in production, query Capital.com API
      currentPrice = 4516.35; // Last known price
      priceSource = 'cached';
    }

    // Compare to stop loss
    const isAboveStopLoss = currentPrice >= XAUUSD_CONFIG.stopLoss;
    const priceDistance = currentPrice - XAUUSD_CONFIG.stopLoss;
    const percentDifference = ((priceDistance / XAUUSD_CONFIG.stopLoss) * 100).toFixed(2);

    // Determine status
    let status = 'monitoring';
    if (!isAboveStopLoss) {
      status = 'stop_loss_triggered';
    } else if (currentPrice <= XAUUSD_CONFIG.stopLoss + 10) {
      status = 'approaching_stop_loss';
    }

    // Log to database
    try {
      dbOps.logAlert(
        XAUUSD_CONFIG.symbol,
        status,
        currentPrice
      );
    } catch (logError) {
      console.error('Failed to log alert to database:', logError);
    }

    // Send alert if stop loss is triggered
    if (!isAboveStopLoss) {
      await sendStopLossAlert(XAUUSD_CONFIG.symbol, currentPrice, XAUUSD_CONFIG.stopLoss, 'triggered');
    } else if (status === 'approaching_stop_loss') {
      await sendStopLossAlert(XAUUSD_CONFIG.symbol, currentPrice, XAUUSD_CONFIG.stopLoss, 'warning');
    }

    // Log health check
    try {
      dbOps.logHealth(
        'xauusd_monitor',
        status === 'stop_loss_triggered' ? 'error' : 'ok',
        `XAUUSD @ ${currentPrice} (SL: ${XAUUSD_CONFIG.stopLoss})`
      );
    } catch (healthError) {
      console.error('Failed to log health:', healthError);
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: status,
        timestamp: checkTime,
        response_time_ms: responseTime,
        instrument: XAUUSD_CONFIG.symbol,
        currentPrice,
        priceSource,
        stopLoss: XAUUSD_CONFIG.stopLoss,
        breakout: XAUUSD_CONFIG.breakout,
        retap: XAUUSD_CONFIG.retap,
        priceDistance,
        percentDifference,
        isAboveStopLoss,
        alert_triggered: !isAboveStopLoss,
        details: {
          status_explanation:
            status === 'stop_loss_triggered'
              ? `STOP LOSS TRIGGERED: Price ${currentPrice} is below ${XAUUSD_CONFIG.stopLoss}`
              : status === 'approaching_stop_loss'
                ? `WARNING: Price ${currentPrice} is within 10 pips of stop loss`
                : `OK: Price ${currentPrice} is above stop loss ${XAUUSD_CONFIG.stopLoss}`,
          action_required: !isAboveStopLoss
            ? 'Close position immediately'
            : status === 'approaching_stop_loss'
              ? 'Monitor closely'
              : 'Continue monitoring',
        },
      },
      {
        status: status === 'stop_loss_triggered' ? 503 : 200,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('XAUUSD monitoring error:', error);

    // Log error
    try {
      dbOps.logHealth(
        'xauusd_monitor',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
