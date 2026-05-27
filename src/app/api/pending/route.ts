/**
 * Pending Trades Approval Queue
 * GET: List all pending trades waiting for approval
 * POST: Internal use - submitted via webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { alertTradePending, alertTradeRejected } from '@/lib/alerts';

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

const PENDING_FILE = path.join(process.cwd(), '.db', 'pending_trades.json');

function ensurePendingFile(): void {
  const dbDir = path.dirname(PENDING_FILE);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(PENDING_FILE)) {
    fs.writeFileSync(PENDING_FILE, JSON.stringify([], null, 2));
  }
}

function generateId(): string {
  return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * GET /api/pending
 * List all pending trades waiting for approval
 */
export async function GET(request: NextRequest) {
  try {
    ensurePendingFile();
    const data = fs.readFileSync(PENDING_FILE, 'utf-8');
    const trades: PendingTrade[] = JSON.parse(data);

    // Filter for pending trades only, exclude expired
    const now = new Date();
    const pending = trades.filter((trade) => {
      if (trade.status !== 'pending') return false;
      if (new Date(trade.expires_at) < now) {
        trade.status = 'rejected';
        trade.error_message = 'Expired (5 min timeout)';
        return false;
      }
      return true;
    });

    // Save updated trades (with expirations marked)
    fs.writeFileSync(PENDING_FILE, JSON.stringify(trades, null, 2));

    return NextResponse.json({
      count: pending.length,
      trades: pending.map((t) => ({
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
    ensurePendingFile();
    const data = fs.readFileSync(PENDING_FILE, 'utf-8');
    const trades: PendingTrade[] = JSON.parse(data);
    const thirtySecondsAgo = new Date(Date.now() - 30000);

    const duplicate = trades.find(
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

    // Create pending trade
    const tradeId = generateId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    const pendingTrade: PendingTrade = {
      id: tradeId,
      symbol,
      direction,
      entry_level,
      stop_level,
      retap_level,
      risk_amount,
      scenario,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    };

    trades.push(pendingTrade);
    fs.writeFileSync(PENDING_FILE, JSON.stringify(trades, null, 2));

    // Send alert
    await alertTradePending(symbol, direction, entry_level);

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
  } catch (error) {
    console.error('[PENDING] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to queue trade' },
      { status: 500 }
    );
  }
}
