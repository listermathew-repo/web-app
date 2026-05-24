import { NextRequest, NextResponse } from 'next/server';
import { dbOps } from '@/lib/db';
import { sendAlert } from '@/lib/alerts';

/**
 * Health Check Endpoint - Monitor system components
 * GET /api/health - Returns status of all system components
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; message?: string; lastCheck: string }> = {};

  try {
    // 1. Database health check
    try {
      const recentTrades = dbOps.getPendingTrades();
      checks.database = {
        status: 'ok',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      checks.database = {
        status: 'error',
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
        lastCheck: new Date().toISOString(),
      };
    }

    // 2. Check for recent webhook activity (last 15 minutes)
    try {
      const recentTrades = dbOps.getPendingTrades();
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60000);

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

    // 3. Check positions from Capital.com (cache OK)
    try {
      // Don't actually call Capital.com on health check to avoid rate limiting
      // Just mark as "ok" if credentials are configured
      const hasCapitalCreds = process.env.CAPITAL_COM_API_KEY && process.env.CAPITAL_COM_ACCOUNT_ID;
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

    // 4. Check ntfy.sh connectivity (optional - don't block)
    checks.ntfy = {
      status: process.env.NTFY_WEBHOOK_URL ? 'ok' : 'warning',
      message: process.env.NTFY_WEBHOOK_URL ? 'ntfy.sh configured' : 'ntfy.sh not configured',
      lastCheck: new Date().toISOString(),
    };

    // Determine overall status
    const allErrors = Object.values(checks).filter(c => c.status === 'error');
    const overallStatus = allErrors.length > 0 ? 'degraded' : 'ok';

    // Log health metrics
    const duration = Date.now() - startTime;
    console.log(`[HEALTH] Overall: ${overallStatus}, Duration: ${duration}ms, Components checked: ${Object.keys(checks).length}`);

    return NextResponse.json(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        components: checks,
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
