import { NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { sendAlert, sendStopLossAlert } from '@/lib/alerts';

/**
 * GET /api/monitor/gold
 * Real-time XAUUSD stop loss monitoring
 * Check current price against 4534.74 stop loss level
 */
export async function GET() {
  try {
    // XAUUSD stop loss configuration
    const XAUUSD_STOP_LOSS = 4534.74;
    const symbol = 'XAUUSD';

    // Get current price from Capital.com via their API
    // For now, we'll fetch from TradingView or Capital.com
    // This is a placeholder that would be replaced with actual API call
    const response = await fetch(
      'https://api.capital.com/api/v1/market/XAUUSD',
      {
        headers: {
          'Authorization': `Bearer ${process.env.CAPITAL_COM_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
      }
    ).catch(() => null);

    // Fallback: use hardcoded or database cached value
    let currentPrice = 0;
    let priceSource = 'cache';

    if (response?.ok) {
      const data = await response.json();
      currentPrice = data.bid || data.price || 0;
      priceSource = 'capital.com';
    } else {
      // Fallback to last logged price from database
      const recentLog = (dbOps.getTradeHistory({ symbol, status: 'filled' }) || [])[0];
      currentPrice = recentLog?.entry_price || 4533.89; // Default to last known price
    }

    // Check against stop loss
    const isTriggered = currentPrice < XAUUSD_STOP_LOSS;
    const difference = currentPrice - XAUUSD_STOP_LOSS;

    // Log to database
    try {
      dbOps.logAlert(symbol, isTriggered ? 'stop_loss_triggered' : 'stop_loss_warning', currentPrice);
    } catch (dbError) {
      console.error('Failed to log alert:', dbError);
    }

    // Send alert if triggered
    if (isTriggered) {
      const alertMessage = `🔴 GOLD STOP LOSS TRIGGERED - Price ${currentPrice} below ${XAUUSD_STOP_LOSS} - EXIT SIGNAL ACTIVE`;
      console.error(alertMessage);

      try {
        await sendStopLossAlert(symbol, currentPrice, XAUUSD_STOP_LOSS, 'triggered');
      } catch (alertError) {
        console.error('Failed to send alert:', alertError);
      }
    } else if (Math.abs(difference) < 5) {
      // Warning if within 5 pips of stop loss
      try {
        await sendStopLossAlert(symbol, currentPrice, XAUUSD_STOP_LOSS, 'warning');
      } catch (alertError) {
        console.error('Failed to send warning:', alertError);
      }
    }

    return NextResponse.json({
      status: 'monitored',
      symbol,
      current_price: currentPrice,
      stop_loss: XAUUSD_STOP_LOSS,
      difference: parseFloat(difference.toFixed(2)),
      triggered: isTriggered,
      price_source: priceSource,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GOLD monitoring error:', error);

    // Send error alert
    try {
      await sendAlert({ type: 'error', message: `🔴 GOLD MONITOR ERROR: ${error instanceof Error ? error.message : String(error)}`, tags: ['gold_monitor', 'error'] });
    } catch (alertError) {
      console.error('Failed to send error alert:', alertError);
    }

    return NextResponse.json(
      {
        error: 'Failed to monitor GOLD stop loss',
        status: 'error',
      },
      { status: 500 }
    );
  }
}
