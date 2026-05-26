import { NextResponse } from 'next/server';
import { isTradingPaused, getPauseStatus } from '@/lib/trading-pause';

/**
 * GET /api/trading-pause
 * Returns whether trading is currently paused due to high-impact economic events
 */
export async function GET() {
  try {
    const pauseStatus = getPauseStatus();

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        ...pauseStatus,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=10', // Cache for 10 seconds
        },
      }
    );
  } catch (error) {
    console.error('Trading pause check error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        trading_paused: false,
        error: 'Failed to check trading pause status',
      },
      { status: 500 }
    );
  }
}
