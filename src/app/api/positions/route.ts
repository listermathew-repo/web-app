/**
 * Position Tracking Endpoint
 * GET: Fetch all open positions from Capital.com with current P&L
 */

import { NextResponse } from 'next/server';
import { alertCapitalComError } from '@/lib/alerts';

interface OpenPosition {
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  current_price: number;
  size: number;
  pnl: number;
  pnl_percent: number;
  stop_price: number;
  stop_distance: number;
  deal_reference: string;
  opened_at: string;
}

interface PositionSummary {
  timestamp: string;
  total_positions: number;
  total_exposure: number;
  total_pnl: number;
  max_loss: number;
  open_positions: OpenPosition[];
}

// Mock Capital.com positions (replace with real API call)
function getMockPositions(): OpenPosition[] {
  return [
    {
      symbol: 'AUDUSD',
      direction: 'long',
      entry_price: 0.6520,
      current_price: 0.6535,
      size: 50000,
      pnl: 750,
      pnl_percent: 0.23,
      stop_price: 0.6480,
      stop_distance: 55,
      deal_reference: 'deal_1234567_abc',
      opened_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      symbol: 'XAUUSD',
      direction: 'short',
      entry_price: 2345.50,
      current_price: 2340.25,
      size: 10,
      pnl: 525,
      pnl_percent: 0.22,
      stop_price: 2360.00,
      stop_distance: 14.75,
      deal_reference: 'deal_1234568_def',
      opened_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
}

/**
 * GET /api/positions
 * Retrieve all open positions with live P&L
 */
export async function GET() {
  try {
    // TODO: Replace with real Capital.com API call
    // For now, return mock data
    const positions = getMockPositions();

    const totalExposure = positions.reduce((sum, p) => sum + Math.abs(p.size * p.current_price), 0);
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const maxLoss = positions.reduce((max, p) => {
      const lossPerPoint = Math.abs(p.size * (p.stop_price - p.current_price));
      return Math.max(max, lossPerPoint);
    }, 0);

    const summary: PositionSummary = {
      timestamp: new Date().toISOString(),
      total_positions: positions.length,
      total_exposure: totalExposure,
      total_pnl: totalPnl,
      max_loss: maxLoss,
      open_positions: positions,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[POSITIONS] GET error:', error);
    await alertCapitalComError('Failed to fetch positions', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to retrieve positions' },
      { status: 500 }
    );
  }
}
