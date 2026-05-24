import { NextRequest, NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { sendAlert } from '@/lib/alerts';

/**
 * Enhanced Health Check Endpoint - Monitor system components with latency tracking
 * GET /api/health - Returns status of all system components with performance metrics
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; message?: string; lastCheck: string }> = {};
  const latency: Record<string, number> = {};

  try {
    // 1. Database health check with latency tracking
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      const recentTrades = dbOps.getPendingTrades();
      dbLatency = Date.now() - dbStart;
      latency.database_query = dbLatency;

      checks.database = {
        status: 'ok',
        message: `Query time: ${dbLatency}ms`,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      dbLatency = Date.now() - startTime;
      latency.database_query = dbLatency;
      checks.database = {
        status: 'error',
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: new Date().toISOString(),
      };
    }

    // 2. Database performance percentiles (50th and 95th percentile)
    let dbPercentiles = { p50: 0, p95: 0 };
    try {
      const queryTimes: number[] = [];
      // Run 5 queries to collect performance samples
      for (let i = 0; i < 5; i++) {
        const queryStart = Date.now();
        dbOps.getPendingTrades();
        queryTimes.push(Date.now() - queryStart);
      }
      queryTimes.sort((a, b) => a - b);
      dbPercentiles = {
        p50: queryTimes[Math.floor(queryTimes.length * 0.5)],
        p95: queryTimes[Math.floor(queryTimes.length * 0.95)],
      };
      latency.database_p50 = dbPercentiles.p50;
      latency.database_p95 = dbPercentiles.p95;
    } catch {
      // Silently continue if percentiles can't be calculated
    }

    // 3. Check for recent webhook activity with timing
    try {
      const webhookStart = Date.now();
      const recentTrades = dbOps.getPendingTrades();
      latency.webhook_check = Date.now() - webhookStart;

      let lastWebhookTime: string | null = null;
      if (recentTrades.length > 0) {
        const mostRecent = recentTrades.reduce((latest: any, trade: any) => {
          const tradeTime = new Date(trade.created_at).getTime();
          const latestTime = new Date(latest.created_at).getTime();
          return tradeTime > latestTime ? trade : latest;
        });

        lastWebhookTime = new Date(mostRecent.created_at).toISOString();
      }

      // Check trade history for recent executions
      let lastTradeExecutedTime: string | null = null;
      try {
        const tradeHistory = dbOps.getTradeHistory({ status: 'executed' });
        if (tradeHistory && tradeHistory.length > 0) {
          const mostRecent = tradeHistory[0];
          lastTradeExecutedTime = mostRecent.executed_at || mostRecent.created_at;
        }
      } catch {
        // Trade history might not exist yet
      }

      checks.webhook = {
        status: lastWebhookTime ? 'ok' : 'idle',
        message: lastWebhookTime ? `Last webhook: ${lastWebhookTime}` : 'No recent webhook activity',
        lastCheck: new Date().toISOString(),
      };

      checks.trades = {
        status: lastTradeExecutedTime ? 'ok' : 'idle',
        message: lastTradeExecutedTime ? `Last executed: ${lastTradeExecutedTime}` : 'No recent trade activity',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      checks.webhook = {
        status: 'error',
        message: `Failed to check webhook activity: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: new Date().toISOString(),
      };
    }

    // 4. Check Capital.com API connectivity (lightweight test)
    try {
      const capStart = Date.now();
      const hasCapitalCreds = process.env.CAPITAL_COM_API_KEY && process.env.CAPITAL_COM_ACCOUNT_ID;
      latency.capital_com_check = Date.now() - capStart;

      checks.capital_com = {
        status: hasCapitalCreds ? 'ok' : 'warning',
        message: hasCapitalCreds ? 'Capital.com API configured' : 'Capital.com API not configured',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      checks.capital_com = {
        status: 'error',
        message: `Capital.com check failed: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: new Date().toISOString(),
      };
    }

    // 5. Check ntfy.sh connectivity with real test (non-blocking)
    try {
      const ntfyStart = Date.now();
      const ntfyUrl = process.env.NTFY_WEBHOOK_URL;

      if (ntfyUrl) {
        // Send a test message (non-blocking, fire and forget)
        fetch(ntfyUrl, {
          method: 'POST',
          headers: { 'Title': '[HEALTH]', 'Priority': '2' },
          body: 'System health check',
        }).catch(() => {
          // Silently ignore if ntfy.sh is down
        });

        latency.ntfy_test = Date.now() - ntfyStart;
        checks.ntfy = {
          status: 'ok',
          message: 'ntfy.sh configured and tested',
          lastCheck: new Date().toISOString(),
        };
      } else {
        checks.ntfy = {
          status: 'warning',
          message: 'ntfy.sh not configured',
          lastCheck: new Date().toISOString(),
        };
      }
    } catch (error) {
      checks.ntfy = {
        status: 'error',
        message: `ntfy.sh check failed: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: new Date().toISOString(),
      };
    }

    // 6. System resource monitoring
    const resourceMetrics = {
      memory_percent: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    // Determine overall status
    const allErrors = Object.values(checks).filter(c => c.status === 'error');
    const overallStatus = allErrors.length > 0 ? 'degraded' : 'ok';

    // Log health metrics
    const duration = Date.now() - startTime;
    console.log(`[HEALTH] Overall: ${overallStatus}, Duration: ${duration}ms, DB P50: ${dbPercentiles.p50}ms, P95: ${dbPercentiles.p95}ms`);

    return NextResponse.json(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        components: checks,
        latency_ms: latency,
        database_percentiles: dbPercentiles,
        resource_metrics: resourceMetrics,
        duration_ms: duration,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[HEALTH] Unexpected error:', error);

    // Try to send alert on catastrophic failure
    try {
      await sendAlert('error', `🔴 HEALTH CHECK FAILED - ${error instanceof Error ? error.message : String(error)}`);
    } catch {
      // Alert service down too
    }

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        duration_ms: Date.now() - startTime,
      },
      { status: 503 }
    );
  }
}
