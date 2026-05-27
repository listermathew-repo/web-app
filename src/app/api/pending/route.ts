/**
 * Pending Trades Approval Queue
 * GET: List all pending trades waiting for approval
 * POST: Internal use - submitted via webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';

interface PendingTrade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entry_level: number;
  stop_level: number;
  retap_level?: number;
  risk_amount: number;
  scenario?: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  approved_at?: string;
  approved_by?: string;
  execution_price?: number;
  deal_reference?: string;
  error_message?: string;
}

/**
 * GET /api/pending
 * List all pending trades waiting for approval
 */
export async function GET(request: NextRequest) {
  try {
    // Get pending trades from SQLite database
    const trades = dbOps.getPendingTrades() as PendingTrade[];

    return NextResponse.json({
      count: trades.length,
      trades: trades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        direction: t.direction,
        entry_level: t.entry_level,
        stop_level: t.stop_level,
        risk_amount: t.risk_amount,
        scenario: t.scenario,
        created_at: t.created_at,
        expires_at: t.expires_at,
        time_remaining_ms: new Date(t.expires_at).getTime() - Date.now(),
      })),
    });
  } catch (error) {
    console.error('[PENDING] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve pending trades' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pending
 * Queue a new pending trade (called by webhook)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol,
      direction,
      entry_level,
      stop_level,
      retap_level,
      risk_amount = 400,
      scenario,
    } = body;

    // Validation
    if (!symbol || !direction || !entry_level || !stop_level) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, direction, entry_level, stop_level' },
        { status: 400 }
      );
    }

    if (!['long', 'short'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be "long" or "short"' },
        { status: 400 }
      );
    }

    // Check for duplicate trades (within 30 seconds)
    const allTrades = dbOps.getPendingTrades() as PendingTrade[];
    const thirtySecondsAgo = new Date(Date.now() - 30000);

    const duplicate = allTrades.find(
      (t) =>
        t.symbol === symbol &&
        t.direction === direction &&
        t.status === 'pending' &&
        new Date(t.created_at) > thirtySecondsAgo
    );

    if (duplicate) {
      return NextResponse.json(
        {
          error: 'Duplicate trade detected within 30 seconds',
          existing_trade_id: duplicate.id,
        },
        { status: 429 }
      );
    }

    // Create pending trade via dbOps
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      dbOps.insertPendingTrade({
        id: tradeId,
        symbol,
        direction,
        entry_level,
        stop_level,
        retap_level,
        risk_amount,
        scenario,
      });

      return NextResponse.json(
        {
          status: 'queued',
          trade_id: tradeId,
          symbol,
          direction,
          entry_level,
          approval_required: true,
          expires_in_seconds: 300,
        },
        { status: 202 }
      );
    } catch (dbError) {
      console.error('[PENDING] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to queue trade in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[PENDING] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to queue trade' },
      { status: 500 }
    );
  }
}
