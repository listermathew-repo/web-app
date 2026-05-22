import { NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { sendAlert, sendStopLossAlert } from '@/lib/alerts';

/**
 * GET /api/monitor/all
 * Comprehensive stop loss monitoring for all 4 instruments
 * Checks: EURUSD, XAUUSD, BTCUSD, AUDUSD
 * Sends URGENT alerts if any price is below stop loss
 * Logs all checks to database
 */

interface InstrumentConfig {
  symbol: string;
  displayName: string;
  breakout: number;
  retap: number;
  stopLoss: number;
  risk: number;
  currentPrice?: number;
}

const INSTRUMENTS: Record<string, InstrumentConfig> = {
  EURUSD: {
    symbol: 'EURUSD',
    displayName: 'EUR/USD',
    breakout: 1.16353,
    retap: 1.16260,
    stopLoss: 1.1617,
    risk: 400,
  },
  XAUUSD: {
    symbol: 'XAUUSD',
    displayName: 'Gold (XAU/USD)',
    breakout: 4570.895,
    retap: 4555,
    stopLoss: 4534.74,
    risk: 400,
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    displayName: 'Bitcoin (BTC/USD)',
    breakout: 78103,
    retap: 77950,
    stopLoss: 77155,
    risk: 400,
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    displayName: 'AUD/USD',
    breakout: 0.7143,
    retap: 0.7130,
    stopLoss: 0.7110,
    risk: 400,
  },
};

// Mock prices for demonstration (replace with Capital.com API in production)
const MOCK_PRICES: Record<string, number> = {
  EURUSD: 1.1620,
  XAUUSD: 4516.35,
  BTCUSD: 77800,
  AUDUSD: 0.7115,
};

export async function GET() {
  try {
    const startTime = Date.now();
    const checkTime = new Date().toISOString();

    const results: Record<string, any> = {};
    const triggeredAlerts: string[] = [];
    const warningAlerts: string[] = [];

    // Check each instrument
    for (const [key, config] of Object.entries(INSTRUMENTS)) {
      const currentPrice = MOCK_PRICES[key] || config.stopLoss;
      const isAboveStopLoss = currentPrice >= config.stopLoss;
      const priceDistance = currentPrice - config.stopLoss;
      const percentDifference = ((priceDistance / config.stopLoss) * 100).toFixed(2);

      let status = 'monitoring';
      if (!isAboveStopLoss) {
        status = 'stop_loss_triggered';
        triggeredAlerts.push(`🔴 ${config.symbol}: ${currentPrice} (SL: ${config.stopLoss})`);
      } else if (currentPrice <= config.stopLoss + (config.stopLoss * 0.002)) {
        // Within 0.2% of stop loss
        status = 'approaching_stop_loss';
        warningAlerts.push(`⚠️ ${config.symbol}: ${currentPrice} (near SL: ${config.stopLoss})`);
      }

      // Log to database
      try {
        dbOps.logAlert(config.symbol, status, currentPrice);
      } catch (logError) {
        console.error(`Failed to log ${config.symbol} alert:`, logError);
      }

      // Send alerts if needed
      if (!isAboveStopLoss) {
        await sendStopLossAlert(config.symbol, currentPrice, config.stopLoss, 'triggered');
      } else if (status === 'approaching_stop_loss') {
        await sendStopLossAlert(config.symbol, currentPrice, config.stopLoss, 'warning');
      }

      results[key] = {
        symbol: config.symbol,
        displayName: config.displayName,
        currentPrice,
        stopLoss: config.stopLoss,
        breakout: config.breakout,
        retap: config.retap,
        priceDistance,
        percentDifference: `${percentDifference}%`,
        isAboveStopLoss,
        status,
        actionRequired: !isAboveStopLoss
          ? 'CLOSE POSITION IMMEDIATELY'
          : status === 'approaching_stop_loss'
            ? 'Monitor closely'
            : 'Continue monitoring',
      };
    }

    // Log overall health
    const overallStatus = triggeredAlerts.length > 0 ? 'error' : 'ok';
    try {
      dbOps.logHealth(
        'monitor_all',
        overallStatus,
        `Checked ${Object.keys(INSTRUMENTS).length} instruments. Alerts: ${triggeredAlerts.length}`
      );
    } catch (logError) {
      console.error('Failed to log health:', logError);
    }

    // Send summary alert if there are triggered stop losses
    if (triggeredAlerts.length > 0) {
      const summary = `🔴 STOP LOSS ALERT SUMMARY\n\n${triggeredAlerts.join('\n')}`;
      await sendAlert('error', summary);
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: overallStatus,
        timestamp: checkTime,
        response_time_ms: responseTime,
        instruments_checked: Object.keys(INSTRUMENTS).length,
        alerts_triggered: triggeredAlerts.length,
        warnings: warningAlerts.length,
        triggered_symbols: triggeredAlerts,
        warning_symbols: warningAlerts,
        results,
        summary: {
          total_instruments: Object.keys(INSTRUMENTS).length,
          critical_alerts: triggeredAlerts.length,
          warning_alerts: warningAlerts.length,
          all_clear: triggeredAlerts.length === 0 && warningAlerts.length === 0,
        },
      },
      {
        status: triggeredAlerts.length > 0 ? 503 : 200,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Monitor all error:', error);

    try {
      dbOps.logHealth(
        'monitor_all',
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
