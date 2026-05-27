/**
 * Pending Trade Approval/Rejection Endpoints
 * POST /api/pending/[id]/approve - Execute the trade
 * POST /api/pending/[id]/reject - Reject the trade
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { alertTradeExecuted, alertTradeRejected, alertCapitalComError } from '@/lib/alerts';

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

interface TradeHistory {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  stop_price: number;
  retap_level?: number;
  size: number;
  risk_amount: number;
  deal_reference?: string;
  status: 'pending' | 'approved' | 'filled' | 'failed' | 'exited';
  created_at: string;
  executed_at?: string;
  exited_at?: string;
  exit_price?: number;
  pnl?: number;
  error_message?: string;
}

const PENDING_FILE = path.join(process.cwd(), '.db', 'pending_trades.json');
const HISTORY_FILE = path.join(process.cwd(), '.db', 'trade_history.json');

function ensureFiles(): void {
  const dbDir = path.dirname(PENDING_FILE);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(PENDING_FILE)) {
    fs.writeFileSync(PENDING_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * POST /api/pending/[id]/approve
 * Approve and execute a pending trade
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tradeId } = await params;

  try {
    ensureFiles();
    const pendingData = fs.readFileSync(PENDING_FILE, 'utf-8');
    const trades: PendingTrade[] = JSON.parse(pendingData);

    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    if (trade.status !== 'pending') {
      return NextResponse.json(
        { error: `Trade status is ${trade.status}, cannot approve` },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    if (new Date(trade.expires_at) < now) {
      trade.status = 'rejected';
      trade.error_message = 'Expired (5 min timeout)';
      fs.writeFileSync(PENDING_FILE, JSON.stringify(trades, null, 2));
      return NextResponse.json(
        { error: 'Trade has expired' },
        { status: 400 }
      );
    }

    // Execute trade with Capital.com (mock for now)
    const executionPrice = trade.entry_level;
    const dealReference = `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update pending trade
    trade.status = 'approved';
    trade.approved_at = now.toISOString();
    trade.approved_by = 'manual';
    trade.execution_price = executionPrice;
    trade.deal_reference = dealReference;

    // Add to history
    const historyData = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const history: TradeHistory[] = JSON.parse(historyData);

    history.push({
      id: trade.id,
      symbol: trade.symbol,
      direction: trade.direction,
      entry_price: trade.entry_level,
      stop_price: trade.stop_level,
      retap_level: trade.retap_level,
      size: trade.risk_amount / 10, // Risk amount / 10 = position size (placeholder)
      risk_amount: trade.risk_amount,
      deal_reference: dealReference,
      status: 'filled',
      created_at: trade.created_at,
      executed_at: now.toISOString(),
    });

    fs.writeFileSync(PENDING_FILE, JSON.stringify(trades, null, 2));
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    // Send success alert
    await alertTradeExecuted(trade.symbol, trade.direction, executionPrice, dealReference);

    return NextResponse.json({
      status: 'executed',
      trade_id: tradeId,
      symbol: trade.symbol,
      direction: trade.direction,
      execution_price: executionPrice,
      deal_reference: dealReference,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[PENDING] Approve error:', error);
    await alertCapitalComError('Trade execution failed', { trade_id: tradeId, error });
    return NextResponse.json(
      { error: 'Trade execution failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pending/[id]
 * Reject a pending trade
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tradeId } = await params;

  try {
    ensureFiles();
    const pendingData = fs.readFileSync(PENDING_FILE, 'utf-8');
    const trades: PendingTrade[] = JSON.parse(pendingData);

    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    if (trade.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot reject trade with status: ${trade.status}` },
        { status: 400 }
      );
    }

    trade.status = 'rejected';
    trade.error_message = 'Manually rejected';
    fs.writeFileSync(PENDING_FILE, JSON.stringify(trades, null, 2));

    // Send rejection alert
    await alertTradeRejected(trade.symbol, trade.direction);

    return NextResponse.json({
      status: 'rejected',
      trade_id: tradeId,
      symbol: trade.symbol,
      direction: trade.direction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PENDING] Reject error:', error);
    return NextResponse.json(
      { error: 'Failed to reject trade' },
      { status: 500 }
    );
  }
}
