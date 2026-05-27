/**
 * Health Check Endpoint
 * GET: System health status for all critical components
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ComponentHealth {
  status: 'ok' | 'error' | 'unknown';
  last_check: string;
  last_error?: string;
  response_time_ms?: number;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime_minutes: number;
  components: {
    webhook: ComponentHealth;
    database: ComponentHealth;
    capital_com: ComponentHealth;
    ntfy: ComponentHealth;
  };
  last_webhook_received?: string;
  last_trade_executed?: string;
  error_count_24h: number;
  alerts_sent_24h: number;
}

const startTime = Date.now();

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const dbPath = path.join(process.cwd(), '.db', 'economic_calendar.json');
    if (!fs.existsSync(dbPath)) {
      return {
        status: 'error',
        last_check: new Date().toISOString(),
        last_error: 'Database file not found',
        response_time_ms: Date.now() - start,
      };
    }
    const data = fs.readFileSync(dbPath, 'utf-8');
    JSON.parse(data);
    return {
      status: 'ok',
      last_check: new Date().toISOString(),
      response_time_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      last_check: new Date().toISOString(),
      last_error: String(error),
      response_time_ms: Date.now() - start,
    };
  }
}

async function checkCapitalCom(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    // Mock check - replace with real API call
    // await fetch('https://api.capital.com/api/v1/accounts', ...)
    return {
      status: 'ok',
      last_check: new Date().toISOString(),
      response_time_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      last_check: new Date().toISOString(),
      last_error: String(error),
      response_time_ms: Date.now() - start,
    };
  }
}

async function checkNtfy(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const topic = process.env.NTFY_TOPIC || 'mgm-7k4x-live';
    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: { 'Title': '[HEALTH]' },
      body: 'Health check ping',
    });
    if (response.ok) {
      return {
        status: 'ok',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - start,
      };
    }
    return {
      status: 'error',
      last_check: new Date().toISOString(),
      last_error: `HTTP ${response.status}`,
      response_time_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      last_check: new Date().toISOString(),
      last_error: String(error),
      response_time_ms: Date.now() - start,
    };
  }
}

/**
 * GET /api/health
 * System health status
 */
export async function GET() {
  try {
    const [dbHealth, capitalHealth, ntfyHealth] = await Promise.all([
      checkDatabase(),
      checkCapitalCom(),
      checkNtfy(),
    ]);

    const uptimeMinutes = Math.floor((Date.now() - startTime) / 60000);

    // Determine overall status
    const componentErrors = [dbHealth, capitalHealth, ntfyHealth].filter(
      (c) => c.status === 'error'
    ).length;

    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (componentErrors >= 2) {
      overallStatus = 'critical';
    } else if (componentErrors === 1) {
      overallStatus = 'degraded';
    }

    // Mock webhook data (would come from database in production)
    const lastWebhookReceived = new Date(Date.now() - 300000).toISOString(); // 5 min ago
    const lastTradeExecuted = new Date(Date.now() - 1800000).toISOString(); // 30 min ago

    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime_minutes: uptimeMinutes,
      components: {
        webhook: { status: 'ok', last_check: new Date().toISOString() },
        database: dbHealth,
        capital_com: capitalHealth,
        ntfy: ntfyHealth,
      },
      last_webhook_received: lastWebhookReceived,
      last_trade_executed: lastTradeExecuted,
      error_count_24h: 0, // Would query database
      alerts_sent_24h: 3, // Would query database
    };

    return NextResponse.json(health);
  } catch (error) {
    console.error('[HEALTH] Check error:', error);
    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
