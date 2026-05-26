import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck } from '@/lib/health-check-scheduler';

/**
 * GET /api/health-check-cron
 * Triggered by external cron service (e.g., EasyCron, AWS Lambda, GitHub Actions)
 * Authenticates via Authorization header (Bearer token)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization token
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.HEALTH_CHECK_TOKEN || process.env.WEBHOOK_API_KEY;

    if (!expectedToken) {
      console.warn('[HEALTH-CHECK-CRON] No token configured');
      return NextResponse.json(
        { error: 'Health check token not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[HEALTH-CHECK-CRON] Missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring('Bearer '.length);
    if (token !== expectedToken) {
      console.warn('[HEALTH-CHECK-CRON] Invalid token provided');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run health check
    const results = await runHealthCheck();

    // Return results
    return NextResponse.json(
      {
        status: 'completed',
        timestamp: new Date().toISOString(),
        results,
        passed: results.every((r) => r.status === 'ok'),
        failures: results.filter((r) => r.status === 'error'),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[HEALTH-CHECK-CRON] Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health-check-cron
 * Alternative endpoint using POST for better compatibility with some cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
