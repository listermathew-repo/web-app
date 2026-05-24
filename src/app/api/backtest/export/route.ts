import { NextRequest, NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { exportTradesCSV } from '@/lib/trade-logger';

/**
 * GET /api/backtest/export
 * Export trade history as CSV for external analysis
 *
 * Query Parameters:
 * - strategy: 'scenario_1' or 'smcfvg' (optional)
 * - symbol: 'EURUSD', 'XAUUSD', etc. (optional)
 * - since: ISO date string (optional)
 * - until: ISO date string (optional)
 * - format: 'csv' or 'json' (default: 'csv')
 *
 * Example:
 * GET /api/backtest/export?strategy=scenario_1&symbol=EURUSD&since=2026-05-01&until=2026-05-31&format=csv
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const strategy = searchParams.get('strategy') || undefined;
    const symbol = searchParams.get('symbol') || undefined;
    const sinceStr = searchParams.get('since') || undefined;
    const untilStr = searchParams.get('until') || undefined;
    const format = searchParams.get('format') || 'csv';

    console.log(`📊 Exporting backtest data: strategy=${strategy}, symbol=${symbol}, since=${sinceStr}, until=${untilStr}, format=${format}`);

    // Query trades from database
    let trades = dbOps.getTradeHistory({
      symbol,
      status: undefined,
      since: sinceStr,
      until: untilStr,
    });

    // Filter by status (only completed trades)
    trades = trades.filter(t => t.status === 'completed' || t.status === 'executed');

    if (trades.length === 0) {
      console.log('No trades found for export criteria');

      if (format === 'json') {
        return NextResponse.json({
          status: 'ok',
          count: 0,
          trades: [],
          filters: { strategy, symbol, since: sinceStr, until: untilStr },
          message: 'No trades found matching the criteria',
        });
      }

      // Return empty CSV with headers
      const headers = new Headers({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="backtest-export.csv"',
      });

      const csv = 'Date,Symbol,Direction,EntryPrice,ExitPrice,StopPrice,RRTarget,ActualRR,Result,PnL,RiskAmount,Strategy\n';
      return new NextResponse(csv, { status: 200, headers });
    }

    console.log(`✅ Found ${trades.length} trades for export`);

    if (format === 'json') {
      return NextResponse.json({
        status: 'ok',
        count: trades.length,
        trades: trades.map(t => ({
          date: t.created_at,
          symbol: t.symbol,
          direction: t.direction,
          entry_price: t.entry_price,
          exit_price: t.exit_price,
          stop_price: t.stop_price,
          rr_target: t.rr_ratio,
          actual_rr: t.exit_price ? ((t.exit_price - t.entry_price) / (t.entry_price - t.stop_price)) : null,
          result: t.pnl > 0 ? 'WIN' : t.pnl < 0 ? 'LOSS' : 'BREAK',
          pnl: t.pnl,
          risk_amount: t.risk_amount,
          strategy: t.strategy,
          status: t.status,
        })),
        filters: { strategy, symbol, since: sinceStr, until: untilStr },
        statistics: {
          total_trades: trades.length,
          wins: trades.filter(t => t.pnl > 0).length,
          losses: trades.filter(t => t.pnl < 0).length,
          breakeven: trades.filter(t => t.pnl === 0).length,
          total_pnl: trades.reduce((sum, t) => sum + (t.pnl || 0), 0),
          win_rate: ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(2) + '%',
        },
      });
    }

    // Export as CSV
    const csv = exportTradesCSV(trades, true);

    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="backtest-export-${new Date().toISOString().split('T')[0]}.csv"`,
    });

    return new NextResponse(csv, { status: 200, headers });
  } catch (error) {
    console.error('Backtest export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export backtest data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backtest/export
 * Same as GET for convenience (some clients prefer POST for filtered requests)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Construct query params from body
    const params = new URLSearchParams();
    if (body.strategy) params.append('strategy', body.strategy);
    if (body.symbol) params.append('symbol', body.symbol);
    if (body.since) params.append('since', body.since);
    if (body.until) params.append('until', body.until);
    if (body.format) params.append('format', body.format);

    // Delegate to GET handler
    const url = new URL(request.url);
    url.search = params.toString();
    const getRequest = new NextRequest(url, { method: 'GET' });

    return GET(getRequest);
  } catch (error) {
    console.error('Backtest export POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process export request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
