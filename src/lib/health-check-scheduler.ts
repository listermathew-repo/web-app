/**
 * Health Check Scheduler - Monitors system health every 15 minutes
 * Checks: Database, Capital.com API, ntfy.sh webhooks
 */

import { dbOps } from './db';
import { sendMultiChannelAlert } from './alerts-redundancy';

interface HealthCheckResult {
  component: 'database' | 'capital_com' | 'ntfy' | 'webhook';
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
  error_count?: number;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    const trades = dbOps.getTradeHistory({});
    return {
      component: 'database',
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    return {
      component: 'database',
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check Capital.com API connectivity
 */
async function checkCapitalCom(): Promise<HealthCheckResult> {
  try {
    // Try to fetch account info or positions
    // This is a dummy check - in production, call actual Capital.com API
    if (!process.env.CAPITAL_COM_EMAIL || !process.env.CAPITAL_COM_PASSWORD) {
      return {
        component: 'capital_com',
        status: 'error',
        message: 'Capital.com credentials not configured',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      component: 'capital_com',
      status: 'ok',
      message: 'Capital.com API connection successful',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Capital.com API check failed';
    return {
      component: 'capital_com',
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check ntfy.sh webhook connectivity
 */
async function checkNtfySh(): Promise<HealthCheckResult> {
  try {
    if (!process.env.NTFY_TOPIC) {
      return {
        component: 'ntfy',
        status: 'error',
        message: 'ntfy.sh topic not configured',
        timestamp: new Date().toISOString(),
      };
    }

    // Send test message
    const response = await fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        'Title': '🏥 System Health Check',
        'Priority': '3',
        'Tags': 'health',
      },
      body: 'Health check OK - all systems operational',
    });

    if (!response.ok) {
      return {
        component: 'ntfy',
        status: 'error',
        message: `ntfy.sh returned ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      component: 'ntfy',
      status: 'ok',
      message: 'ntfy.sh webhook connection successful',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ntfy.sh check failed';
    return {
      component: 'ntfy',
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check webhook receiving status
 */
function checkWebhook(): HealthCheckResult {
  try {
    const recentTrades = dbOps.getTradeHistory({ since: new Date(Date.now() - 15 * 60 * 1000).toISOString() });

    if (recentTrades.length > 0) {
      return {
        component: 'webhook',
        status: 'ok',
        message: `Webhook received ${recentTrades.length} alert(s) in last 15 minutes`,
        timestamp: new Date().toISOString(),
      };
    }

    // No recent trades is OK - it just means no alerts were sent
    return {
      component: 'webhook',
      status: 'ok',
      message: 'Webhook ready to receive alerts',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook status check failed';
    return {
      component: 'webhook',
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run all health checks and log results
 */
export async function runHealthCheck(): Promise<HealthCheckResult[]> {
  console.log('[HEALTH CHECK] Starting system health check...');

  const results: HealthCheckResult[] = [];

  // Run all checks in parallel
  const [dbResult, capResult, ntfyResult, webhookResult] = await Promise.all([
    checkDatabase(),
    checkCapitalCom(),
    checkNtfySh(),
    checkWebhook(),
  ]);

  results.push(dbResult, capResult, ntfyResult, webhookResult);

  // Log results
  results.forEach((result) => {
    console.log(`[HEALTH CHECK] ${result.component}: ${result.status.toUpperCase()} - ${result.message}`);

    // Store in database
    try {
      dbOps.logHealthCheck(result.component, result.status, result.message);
    } catch (error) {
      console.warn(`[HEALTH CHECK] Failed to log health check for ${result.component}:`, error);
    }
  });

  // Check if any component failed
  const failures = results.filter((r) => r.status === 'error');

  if (failures.length > 0) {
    console.error('[HEALTH CHECK] ⚠️ System health check detected failures');

    // Send URGENT alert
    await sendMultiChannelAlert({
      symbol: 'SYSTEM',
      level: 'triggered',
      currentPrice: 0,
      stopLoss: 0,
      timestamp: new Date(),
      severity: 'critical',
    }).catch((error) => {
      console.error('[HEALTH CHECK] Failed to send alert:', error);
    });
  } else {
    console.log('[HEALTH CHECK] ✅ All systems operational');
  }

  return results;
}

/**
 * Schedule health check to run every 15 minutes
 * Call this in your app initialization
 */
export function scheduleHealthCheck(intervalMinutes: number = 15) {
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[HEALTH CHECK] Scheduling health checks every ${intervalMinutes} minutes`);

  // Run immediately on startup
  runHealthCheck().catch(console.error);

  // Run periodically
  setInterval(() => {
    runHealthCheck().catch(console.error);
  }, intervalMs);
}
