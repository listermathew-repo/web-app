import { NextRequest, NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';

interface BacktestData {
  month: string;
  instrument: string;
  trades: number;
  winRate: number;
  totalRisk: number;
  expectedWins: number;
  expectedLoss: number;
  netPnL: number;
  roi: number;
  riskPerTrade: number;
}

interface BacktestResponse {
  success: boolean;
  data?: BacktestData[];
  summary?: {
    totalNetPnL: number;
    totalROI: number;
    averageMonthlyPnL: number;
    bestMonth: string;
    worstMonth: string;
  };
  error?: string;
}

/**
 * GET /api/backtest - Retrieve backtest results
 * Query params:
 *   - riskPerTrade: 200 | 350 (default: 350)
 *   - period: 4month | february | march | april | may (default: 4month)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const riskPerTrade = (searchParams.get('riskPerTrade') || '350') as '200' | '350';
    const period = searchParams.get('period') || '4month';

    // Retrieve backtest data from database
    let backtestData: BacktestData[] = [];

    if (period === '4month') {
      // Fetch all 4 months
      backtestData = dbOps.getBacktestResults({
        riskPerTrade: parseInt(riskPerTrade),
        months: ['FEB', 'MAR', 'APR', 'MAY'],
      });
    } else {
      // Fetch specific month
      const monthMap: Record<string, string> = {
        february: 'FEB',
        march: 'MAR',
        april: 'APR',
        may: 'MAY',
      };
      const month = monthMap[period] || 'APR';
      backtestData = dbOps.getBacktestResults({
        riskPerTrade: parseInt(riskPerTrade),
        months: [month],
      });
    }

    // Calculate summary
    if (backtestData.length > 0) {
      const totalNetPnL = backtestData.reduce((sum, d) => sum + d.netPnL, 0);
      const totalRisk = backtestData.reduce((sum, d) => sum + d.totalRisk, 0);
      const totalROI = totalRisk > 0 ? totalNetPnL / totalRisk : 0;
      const averageMonthlyPnL = totalNetPnL / backtestData.length;

      const sorted = [...backtestData].sort((a, b) => b.netPnL - a.netPnL);
      const bestMonth = sorted[0]?.month || 'N/A';
      const worstMonth = sorted[sorted.length - 1]?.month || 'N/A';

      return NextResponse.json<BacktestResponse>(
        {
          success: true,
          data: backtestData,
          summary: {
            totalNetPnL,
            totalROI,
            averageMonthlyPnL,
            bestMonth,
            worstMonth,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json<BacktestResponse>(
      {
        success: false,
        error: 'No backtest data found',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('[BACKTEST] Error:', error);
    return NextResponse.json<BacktestResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backtest - Store backtest results
 * Body:
 *   - month: FEB | MAR | APR | MAY
 *   - instrument: BTCUSD | XAUUSD | etc
 *   - trades, winRate, totalRisk, expectedWins, expectedLoss, netPnL, roi, riskPerTrade
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, instrument, trades, winRate, totalRisk, expectedWins, expectedLoss, netPnL, roi, riskPerTrade } =
      body as BacktestData;

    // Validate required fields
    if (!month || !instrument || !trades || winRate === undefined) {
      return NextResponse.json<BacktestResponse>(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Store in database
    const result = dbOps.insertBacktestResult({
      month,
      instrument,
      trades,
      winRate,
      totalRisk,
      expectedWins,
      expectedLoss,
      netPnL,
      roi,
      riskPerTrade,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<BacktestResponse>(
      {
        success: true,
        data: [{
          month,
          instrument,
          trades,
          winRate,
          totalRisk,
          expectedWins,
          expectedLoss,
          netPnL,
          roi,
          riskPerTrade,
        }],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[BACKTEST] Error:', error);
    return NextResponse.json<BacktestResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
