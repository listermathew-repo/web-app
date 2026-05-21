import { NextRequest, NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { sendTradeAlert, sendErrorAlert } from '@/lib/alerts';

/**
 * GET /api/pending
 * List all pending trades awaiting approval
 */
export async function GET(request: NextRequest) {
  try {
    // Auto-cleanup expired trades first
    dbOps.autoCleanupExpiredTrades();

    // Get pending trades
    const trades = dbOps.getPendingTrades();

    // Add time remaining to each trade
    const tradesWithExpiry = trades.map((trade: any) => ({
      ...trade,
      time_remaining_seconds: Math.max(
        0,
        Math.floor((new Date(trade.created_at).getTime() + 5 * 60 * 1000 - Date.now()) / 1000)
      ),
    }));

    return NextResponse.json({
      status: 'ok',
      count: tradesWithExpiry.length,
      trades: tradesWithExpiry,
    });
  } catch (error) {
    console.error('GET /api/pending error:', error);
    await sendErrorAlert('PENDING_LIST', error as Error);
    return NextResponse.json(
      { error: 'Failed to retrieve pending trades' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pending/[id]/approve
 * Approve a pending trade and prepare for execution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const path = request.nextUrl.pathname;
    const pathParts = path.split('/');
    const tradeId = pathParts[3]; // /api/pending/[id]/approve
    const action = pathParts[4]; // approve or reject

    if (!tradeId) {
      return NextResponse.json(
        { error: 'Trade ID required' },
        { status: 400 }
      );
    }

    // Get the trade
    const trade = dbOps.getPendingTradeById(tradeId);
    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (trade.status !== 'pending') {
      return NextResponse.json(
        { error: `Trade already ${trade.status}` },
        { status: 400 }
      );
    }

    // Check if expired (5 minutes)
    const createdAt = new Date(trade.created_at).getTime();
    const now = Date.now();
    if (now - createdAt > 5 * 60 * 1000) {
      dbOps.rejectPendingTrade(tradeId, 'Expired (5 min limit)');
      await sendTradeAlert(
        'rejected',
        trade.symbol,
        trade.direction,
        trade.entry_level,
        { reason: 'Expired - 5 minute approval window' }
      );
      return NextResponse.json(
        { error: 'Trade expired - approval window closed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Approve the trade
      try {
        // In a real scenario, this would call Capital.com API
        // For now, simulate successful execution
        const executionPrice = trade.entry_level;
        const dealReference = `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Update trade status
        dbOps.approvePendingTrade(tradeId, executionPrice, dealReference);

        // Send success alert
        await sendTradeAlert(
          'executed',
          trade.symbol,
          trade.direction,
          executionPrice,
          { deal_reference: dealReference, stop: trade.stop_level }
        );

        console.log(`Trade approved: ${tradeId}`);

        return NextResponse.json({
          status: 'approved',
          trade_id: tradeId,
          symbol: trade.symbol,
          direction: trade.direction,
          entry_level: trade.entry_level,
          execution_price: executionPrice,
          deal_reference: dealReference,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to approve trade:', error);
        await sendErrorAlert('TRADE_APPROVAL', error as Error, { trade_id: tradeId });
        return NextResponse.json(
          { error: 'Failed to execute trade' },
          { status: 500 }
        );
      }
    } else if (action === 'reject') {
      // Reject the trade
      const reason = await request.text().then(t => {
        try {
          return JSON.parse(t)?.reason || 'Manual rejection';
        } catch {
          return 'Manual rejection';
        }
      });

      dbOps.rejectPendingTrade(tradeId, reason);
      await sendTradeAlert(
        'rejected',
        trade.symbol,
        trade.direction,
        trade.entry_level,
        { reason }
      );

      console.log(`Trade rejected: ${tradeId} - ${reason}`);

      return NextResponse.json({
        status: 'rejected',
        trade_id: tradeId,
        reason: reason,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action - use /approve or /reject' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('POST /api/pending error:', error);
    await sendErrorAlert('PENDING_ACTION', error as Error);
    return NextResponse.json(
      { error: 'Failed to process trade' },
      { status: 500 }
    );
  }
}

/**
 * Dynamic routing for /api/pending/[id]/[action]
 * This function handles the dynamic segments
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  // Delegate to POST handler for approve/reject
  return POST(request, { params });
}
