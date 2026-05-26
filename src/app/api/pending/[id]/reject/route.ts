import { NextRequest, NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { sendMultiChannelAlert } from '@/lib/alerts-redundancy';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id = 'UNKNOWN';
  try {
    const paramData = await params;
    id = paramData.id;

    // Authenticate with X-API-Key header
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
      console.warn('Unauthorized rejection attempt: Invalid API key');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    // Get pending trade from database
    const pendingTrade = dbOps.getPendingTradeById(id);
    if (!pendingTrade) {
      return NextResponse.json(
        { error: 'Trade not found', trade_id: id },
        { status: 404 }
      );
    }

    // Reject the pending trade
    dbOps.rejectPendingTrade(id, 'Manual rejection');

    // Send rejection alert
    await sendMultiChannelAlert({
      symbol: pendingTrade.symbol,
      level: 'triggered',
      currentPrice: pendingTrade.entry_level,
      stopLoss: pendingTrade.stop_level,
      timestamp: new Date(),
      severity: 'info',
    }).catch(() => null);

    console.log(`❌ Trade rejected: ${id}`);
    console.log(`   Symbol: ${pendingTrade.symbol}`);
    console.log(`   Direction: ${pendingTrade.direction}`);
    console.log(`   Entry: ${pendingTrade.entry_level}`);

    return NextResponse.json(
      {
        status: 'rejected',
        trade_id: id,
        symbol: pendingTrade.symbol,
        direction: pendingTrade.direction,
        reason: 'Manual rejection',
        rejected_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Rejection endpoint error:', error);

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
        error: 'Rejection failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
