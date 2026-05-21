import { NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { sendAlert } from '@/lib/alerts';

/**
 * GET /api/health
 * System health check endpoint
 * Tests database, ntfy, and Capital.com connectivity
 * Returns status of all components
 */
export async function GET() {
  try {
    const startTime = Date.now();
    const components: Record<string, any> = {};

    // 1. Check Database connectivity
    try {
      const recentTrades = dbOps.getTradeHistory({ since: new Date(Date.now() - 3600000).toISOString() });
      components.database = {
        status: 'ok',
        message: 'Database connected',
        recentTrades: recentTrades.length,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      components.database = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database connection failed',
        lastCheck: new Date().toISOString(),
      };
      // Log health check failure
      try {
        dbOps.logHealth('database', 'error', 'Connection test failed');
      } catch (logError) {
        console.error('Failed to log database health:', logError);
      }
    }

    // 2. Check ntfy.sh connectivity
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://ntfy.sh/mgm-7k4x-live', {
        method: 'POST',
        headers: {
          'Title': '[HEALTH_CHECK]',
          'Priority': '3',
          'Tags': 'health',
        },
        body: 'Health check ping from /api/health',
        signal: controller.signal,
      }).catch(() => null).finally(() => clearTimeout(timeoutId));

      if (response?.ok) {
        components.ntfy = {
          status: 'ok',
          message: 'ntfy.sh connection working',
          lastCheck: new Date().toISOString(),
        };
      } else {
        throw new Error('ntfy.sh POST failed');
      }
    } catch (error) {
      components.ntfy = {
        status: 'error',
        message: error instanceof Error ? error.message : 'ntfy.sh connection failed',
        lastCheck: new Date().toISOString(),
      };
      try {
        dbOps.logHealth('ntfy', 'error', 'Connection test failed');
      } catch (logError) {
        console.error('Failed to log ntfy health:', logError);
      }
    }

    // 3. Check Capital.com API (if API key exists)
    if (process.env.CAPITAL_COM_API_KEY) {
      try {
        const capitalController = new AbortController();
        const capitalTimeoutId = setTimeout(() => capitalController.abort(), 5000);

        const capitalResponse = await fetch('https://api.capital.com/api/v1/ping', {
          headers: {
            'Authorization': `Bearer ${process.env.CAPITAL_COM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: capitalController.signal,
        }).catch(() => null).finally(() => clearTimeout(capitalTimeoutId));

        if (capitalResponse?.ok) {
          components.capital_com = {
            status: 'ok',
            message: 'Capital.com API connection working',
            lastCheck: new Date().toISOString(),
          };
        } else {
          throw new Error('Capital.com API response not ok');
        }
      } catch (error) {
        components.capital_com = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Capital.com API connection failed',
          lastCheck: new Date().toISOString(),
        };
        try {
          dbOps.logHealth('capital_com', 'error', 'Connection test failed');
        } catch (logError) {
          console.error('Failed to log Capital.com health:', logError);
        }
      }
    } else {
      components.capital_com = {
        status: 'unknown',
        message: 'Capital.com API key not configured',
        lastCheck: new Date().toISOString(),
      };
    }

    // 4. Get recent alerts and error count
    try {
      const recentAlerts = dbOps.logAlert('HEALTH_CHECK', 'health_check', 0);
      const pendingTrades = dbOps.getPendingTrades();

      const overallStatus = Object.values(components).every((c: any) => c.status === 'ok' || c.status === 'unknown')
        ? 'healthy'
        : 'degraded';

      const responseTime = Date.now() - startTime;

      return NextResponse.json(
        {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          response_time_ms: responseTime,
          components,
          pending_trades: pendingTrades.length,
          last_webhook_received: null, // Would come from database if tracked
        },
        {
          status: overallStatus === 'healthy' ? 200 : 503,
          headers: {
            'Cache-Control': 'no-cache', // Don't cache health checks
          },
        }
      );
    } catch (error) {
      console.error('Health check aggregation error:', error);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Health check failed',
          timestamp: new Date().toISOString(),
          components,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
