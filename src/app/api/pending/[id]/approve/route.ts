import { NextRequest, NextResponse } from 'next/server';
import { getCapitalClient } from '@/lib/capital-client';
import { dbOps } from '@/lib/db';
import { sendMultiChannelAlert } from '@/lib/alerts-redundancy';
import { isTradingPaused } from '@/lib/trading-pause';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = 'UNKNOWN';
  try {
    const paramData = await params;
    id = paramData.id;

    // 0. Authenticate with X-API-Key header
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
      console.warn('Unauthorized approval attempt: Invalid API key');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    // 1. Get pending trade from database
    const pendingTrade = dbOps.getPendingTradeById(id);
    if (!pendingTrade) {
      return NextResponse.json(
        { error: 'Trade not found', trade_id: id },
        { status: 404 }
      );
    }

    // 1.5. Check if trading is paused due to high-impact economic events
    const pauseStatus = isTradingPaused();
    if (pauseStatus.isPaused) {
      console.warn(`Trade approval blocked: ${pauseStatus.reason}`);

      // Reject the trade due to pause
      dbOps.rejectPendingTrade(id, `Trading paused: ${pauseStatus.reason}`);

      await sendMultiChannelAlert({
        symbol: pendingTrade.symbol,
        level: 'triggered',
        currentPrice: pendingTrade.entry_level,
        stopLoss: pendingTrade.stop_level,
        timestamp: new Date(),
        severity: 'warning',
      }).catch(() => null);

      return NextResponse.json(
        {
          status: 'rejected',
          trade_id: id,
          symbol: pendingTrade.symbol,
          reason: `⏸ Trading paused: ${pauseStatus.reason}`,
          resumes_at: pauseStatus.resumesAt,
          minutes_until_resume: pauseStatus.minutesUntilResume,
        },
        { status: 403 }
      );
    }

    // 2. Check if trade has expired (5-minute limit)
    // Use SQLite datetime comparison to avoid timezone issues
    const isExpired = dbOps.isTradeExpired(id);
    if (isExpired) {
      dbOps.rejectPendingTrade(id, 'Trade expired (>5 minutes)');
      await sendMultiChannelAlert({
        symbol: pendingTrade.symbol,
        level: 'triggered',
        currentPrice: pendingTrade.entry_level,
        stopLoss: pendingTrade.stop_level,
        timestamp: new Date(),
        severity: 'warning',
      });

      return NextResponse.json(
        {
          status: 'rejected',
          trade_id: id,
          symbol: pendingTrade.symbol,
          reason: 'Trade expired (>5 minutes)',
        },
        { status: 410 }
      );
    }

    // 3. Initialize Capital.com client
    let capital;
    try {
      capital = getCapitalClient();
    } catch (error) {
      console.error('Failed to initialize Capital.com client:', error);
      return NextResponse.json(
        { error: 'Capital.com client initialization failed' },
        { status: 500 }
      );
    }

    // 4. Execute order on Capital.com
    console.log(`Executing trade: ${pendingTrade.symbol} ${pendingTrade.direction} @ ${pendingTrade.entry_level}`);

    const orderResult = await capital.executeOrder({
      symbol: pendingTrade.symbol,
      direction: pendingTrade.direction as 'long' | 'short',
      size: 1, // 1 lot (adjust as needed based on account size)
      stopPrice: pendingTrade.stop_level,
    });

    // 5. Check if execution succeeded
    if (orderResult.status !== 'executed') {
      console.warn(`Order execution failed: ${orderResult.reason}`);

      // Mark as rejected in database
      dbOps.rejectPendingTrade(id, orderResult.reason || 'Execution failed');

      // Send failure alert
      await sendMultiChannelAlert({
        symbol: pendingTrade.symbol,
        level: 'triggered',
        currentPrice: pendingTrade.entry_level,
        stopLoss: pendingTrade.stop_level,
        timestamp: new Date(),
        severity: 'critical',
      });

      return NextResponse.json(
        {
          status: 'failed',
          trade_id: id,
          symbol: pendingTrade.symbol,
          reason: orderResult.reason || 'Capital.com execution failed',
          deal_reference: orderResult.dealReference,
        },
        { status: 400 }
      );
    }

    // 6. Execution succeeded - update pending trade status
    dbOps.approvePendingTrade(
      id,
      pendingTrade.entry_level,
      orderResult.dealReference
    );

    // 7. Insert into trades table (execution history)
    const tradeId = randomUUID();
    dbOps.insertTrade({
      id: tradeId,
      symbol: pendingTrade.symbol,
      direction: pendingTrade.direction,
      entry_price: pendingTrade.entry_level,
      stop_price: pendingTrade.stop_level,
      retap_level: pendingTrade.retap_level,
      size: 1, // matched lot size from order
      risk_amount: pendingTrade.risk_amount || 400,
      status: 'executed',
      message: `Approved by user at ${new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Adelaide' })} ADL`,
    });

    // 8. Log alert event
    dbOps.logAlert(pendingTrade.symbol, 'execution', pendingTrade.entry_level);

    // 9. Send success alert
    await sendMultiChannelAlert({
      symbol: pendingTrade.symbol,
      level: 'ok',
      currentPrice: pendingTrade.entry_level,
      stopLoss: pendingTrade.stop_level,
      timestamp: new Date(),
      severity: 'info',
    });

    console.log(`✅ Trade executed: ${tradeId}`);
    console.log(`   Symbol: ${pendingTrade.symbol}`);
    console.log(`   Direction: ${pendingTrade.direction}`);
    console.log(`   Entry: ${pendingTrade.entry_level}`);
    console.log(`   Stop: ${pendingTrade.stop_level}`);
    console.log(`   Deal: ${orderResult.dealReference}`);

    // 10. Return success response
    return NextResponse.json(
      {
        status: 'executed',
        trade_id: tradeId,
        symbol: pendingTrade.symbol,
        direction: pendingTrade.direction,
        entry_price: pendingTrade.entry_level,
        stop_price: pendingTrade.stop_level,
        deal_reference: orderResult.dealReference,
        executed_at: new Date().toISOString(),
        timestamp_adl: new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Adelaide' }) + ' ADL',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Approval endpoint error:', error);

    // Send error alert (id is in scope from top of function)
    // Note: if error occurs before id is destructured, this may fail - wrap in try-catch
    try {
      await sendMultiChannelAlert({
        symbol: id || 'UNKNOWN',
        level: 'triggered',
        currentPrice: 0,
        stopLoss: 0,
        timestamp: new Date(),
        severity: 'critical',
      }).catch(() => null);
    } catch (alertError) {
      console.error('Failed to send alert:', alertError);
    }

    return NextResponse.json(
      {
        error: 'Approval failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
