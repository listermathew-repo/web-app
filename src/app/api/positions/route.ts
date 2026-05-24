import { NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { getCapitalClient } from '@/lib/capital-client';

/**
 * GET /api/positions
 * Fetch open positions from database with live prices from Capital.com
 * Returns array of open trades with current P&L based on live market prices
 */
export async function GET() {
  try {
    // Fetch all open (non-exited) trades from database
    const positions = dbOps.getOpenPositions();

    if (positions.length === 0) {
      return NextResponse.json(
        {
          status: 'success',
          count: 0,
          positions: [],
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=60', // 1-min TTL for empty
          },
        }
      );
    }

    // Try to get live positions data from Capital.com
    let capitalPositions: Record<string, any> = {};
    try {
      const capital = getCapitalClient();
      const capitalPos = await capital.getOpenPositions();

      // Index by deal reference for quick lookup
      capitalPos.forEach((pos: any) => {
        if (pos.dealId || pos.deal_reference) {
          capitalPositions[pos.dealId || pos.deal_reference] = pos;
        }
      });
    } catch (error) {
      console.warn('Capital.com API unavailable, using database prices as fallback:', error);
      // Continue with database prices as fallback
    }

    // Transform to API response format
    const formattedPositions = positions.map((pos: any) => {
      // Try to get live data from Capital.com
      const capitalPos = capitalPositions[pos.deal_reference];
      const currentPrice = capitalPos?.currentPrice || capitalPos?.current_price || pos.entry_price;
      const capitalPnL = capitalPos?.pnl || capitalPos?.profit_loss;
      const priceSource = capitalPos ? 'live' : 'database';

      return {
        id: pos.id,
        symbol: pos.symbol,
        direction: pos.direction,
        entry_price: pos.entry_price,
        current_price: currentPrice,
        size: pos.size || capitalPos?.size || 1,
        stop_loss: pos.stop_price,
        take_profit: pos.retap_level,
        risk_amount: pos.risk_amount,
        status: pos.status,
        deal_reference: pos.deal_reference,
        created_at: pos.created_at,
        pnl: capitalPnL !== undefined ? capitalPnL : calculatePnL(pos.direction, pos.entry_price, currentPrice, pos.size || 1),
        pnl_percent: calculatePnLPercent(pos.direction, pos.entry_price, currentPrice),
        price_source: priceSource,
      };
    });

    return NextResponse.json(
      {
        status: 'success',
        count: formattedPositions.length,
        positions: formattedPositions,
        timestamp: new Date().toISOString(),
        note: Object.keys(capitalPositions).length > 0 ? 'Using live data from Capital.com' : 'Using database data (Capital.com unavailable)',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30', // 30-sec TTL for live data
        },
      }
    );
  } catch (error) {
    console.error('Positions fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
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
