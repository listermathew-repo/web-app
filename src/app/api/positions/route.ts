import { NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';

/**
 * GET /api/positions
 * Fetch open positions from database
 * Returns array of open trades with current P&L
 */
export async function GET() {
  try {
    // Fetch all open (non-exited) trades from database
    const positions = dbOps.getOpenPositions();

    // Transform to API response format
    const formattedPositions = positions.map((pos: any) => ({
      id: pos.id,
      symbol: pos.symbol,
      direction: pos.direction,
      entry_price: pos.entry_price,
      current_price: pos.entry_price, // In production, fetch live price
      size: pos.size || 1,
      stop_loss: pos.stop_price,
      take_profit: pos.retap_level,
      risk_amount: pos.risk_amount,
      status: pos.status,
      deal_reference: pos.deal_reference,
      created_at: pos.created_at,
      pnl: calculatePnL(pos.direction, pos.entry_price, pos.entry_price, pos.size || 1),
      pnl_percent: calculatePnLPercent(pos.direction, pos.entry_price, pos.entry_price),
    }));

    return NextResponse.json(
      {
        status: 'success',
        count: formattedPositions.length,
        positions: formattedPositions,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5-min TTL
        },
      }
    );
  } catch (error) {
    console.error('Positions fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        status: 'error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate P&L based on direction
 */
function calculatePnL(direction: string, entry: number, current: number, size: number): number {
  if (direction === 'long') {
    return (current - entry) * size;
  } else {
    return (entry - current) * size;
  }
}

/**
 * Calculate P&L percentage
 */
function calculatePnLPercent(direction: string, entry: number, current: number): number {
  if (entry === 0) return 0;
  if (direction === 'long') {
    return ((current - entry) / entry) * 100;
  } else {
    return ((entry - current) / entry) * 100;
  }
}
