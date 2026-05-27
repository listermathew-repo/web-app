/**
 * E2E Workflow Test - Complete Trading System Flow
 * Tests: Alert → Queue → Approval → Execution → Monitoring
 *
 * Usage: npx ts-node scripts/e2e-workflow-test.ts
 */

const API_KEY = process.env.WEBHOOK_API_KEY || 'e3acbaedddbf49184b9a3c34e3d1c99b';
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const WIKI_PASSWORD = process.env.WIKI_PASSWORD || 'Sanos2026';

// Global cookie jar to maintain auth state across requests
const cookies: string[] = [];

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: Record<string, unknown>;
}

const results: TestResult[] = [];

function logStep(step: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📍 Step: ${step}`);
  console.log(`${'='.repeat(70)}`);
}

function logResult(step: string, status: 'PASS' | 'FAIL', message: string, details?: Record<string, unknown>) {
  const result: TestResult = { step, status, message, details };
  results.push(result);

  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${status}: ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
}

function buildCookieHeader(): string {
  return cookies.length > 0 ? `Cookie: ${cookies.join('; ')}` : '';
}

async function testLogin() {
  logStep('Test Authentication (POST /api/login)');

  try {
    console.log(`🔐 Authenticating with password...`);
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: WIKI_PASSWORD }),
    });

    const setCookieHeader = response.headers.get('set-cookie');

    if (response.status === 200 && setCookieHeader) {
      // Extract the cookie value
      const cookieMatch = setCookieHeader.match(/wiki-auth=([^;]+)/);
      if (cookieMatch) {
        cookies.push(`wiki-auth=${cookieMatch[1]}`);
        logResult('Authentication', 'PASS', 'Successfully logged in', {
          status: response.status,
          cookie_set: true,
        });
        return true;
      }
    }

    logResult('Authentication', 'FAIL', `Expected 200, got ${response.status}`, {
      status: response.status,
      setCookie: setCookieHeader,
    });
    return false;
  } catch (error) {
    logResult('Authentication', 'FAIL', `Network error: ${error}`, null);
    return false;
  }
}

async function testAlertWebhook(symbol: string = 'EURUSD', direction: 'long' | 'short' = 'long') {
  logStep('Test Alert Webhook (POST /api/alerts)');

  try {
    const payload = {
      symbol,
      direction,
      entry_level: 1.16353,
      stop_level: 1.1617,
      risk_amount: 400,
      scenario: 'scenario_1',
      // Chart data from Pine Script (MUST pass validation)
      // Check 1: EMA Alignment - EMA10 > EMA21 for LONG ✓
      ema10: 1.1640,
      ema21: 1.1620,
      // Check 2: VWAP Confirmation - Price > VWAP for LONG ✓
      vwap: 1.1635,
      // Check 3: Volume Confirmation - Volume >= 1.5x average ✓
      volume: 350000,        // was 250000, now 1.75x average (need 1.5x min)
      volume_avg: 200000,
      // Check 4: ATR Volatility - 10-50 pips range ✓
      atr: 0.0020,          // 20 pips (0.0020 / 0.0001) - within 10-50 range
      // Check 5: 4H Candle Timing - <= 30 minutes ago ✓
      minutes_since_4h_close: 15,  // was 120, now 15 minutes (max 30)
      rsi: 45,
    };

    console.log(`📤 Sending alert: ${symbol} ${direction.toUpperCase()}`);
    const response = await fetch(`${BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status === 202 && data.trade_id) {
      logResult('Alert Webhook', 'PASS', `Trade queued: ${data.trade_id}`, {
        status: data.status,
        trade_id: data.trade_id,
        symbol: data.symbol,
        expires_in: data.expires_in_seconds,
      });
      return data.trade_id;
    } else {
      logResult('Alert Webhook', 'FAIL', `Expected 202, got ${response.status}: ${data.reason || data.error}`, data);
      return null;
    }
  } catch (error) {
    logResult('Alert Webhook', 'FAIL', `Network error: ${error}`, null);
    return null;
  }
}

async function testPendingQueueList() {
  logStep('Test Pending Queue (GET /api/pending)');

  try {
    console.log(`📥 Fetching pending trades...`);
    const response = await fetch(`${BASE_URL}/api/pending`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    const data = await response.json();

    if (response.status === 200) {
      logResult('Pending Queue List', 'PASS', `Found ${data.count} pending trade(s)`, {
        count: data.count,
        trades_sample: data.trades?.slice(0, 1),
      });
      return data.trades?.[0]?.id || null;
    } else {
      logResult('Pending Queue List', 'FAIL', `Expected 200, got ${response.status}`, data);
      return null;
    }
  } catch (error) {
    logResult('Pending Queue List', 'FAIL', `Network error: ${error}`, null);
    return null;
  }
}

async function testApprovalEndpoint(tradeId: string) {
  logStep('Test Trade Approval (POST /api/pending/[id]/approve)');

  try {
    console.log(`✅ Approving trade: ${tradeId}`);
    const response = await fetch(`${BASE_URL}/api/pending/${tradeId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (response.status === 200 && data.status === 'executed') {
      logResult('Trade Approval', 'PASS', `Trade executed: ${data.deal_reference}`, {
        status: data.status,
        deal_reference: data.deal_reference,
        entry_price: data.entry_price,
        stop_price: data.stop_price,
      });
      return true;
    } else if (response.status === 401 || response.status === 307) {
      logResult('Trade Approval', 'FAIL', `Authentication required (${response.status}) - this is expected in protected environment`, data);
      return null;
    } else {
      logResult('Trade Approval', 'FAIL', `Expected 200, got ${response.status}: ${data.reason || data.error}`, data);
      return null;
    }
  } catch (error) {
    logResult('Trade Approval', 'FAIL', `Network error: ${error}`, null);
    return null;
  }
}

async function testHealthCheck() {
  logStep('Test System Health (GET /api/health)');

  try {
    console.log(`🏥 Checking system health...`);
    const response = await fetch(`${BASE_URL}/api/health`);

    const data = await response.json();

    if (response.status === 200 && data.status === 'ok') {
      logResult('Health Check', 'PASS', 'All systems operational', {
        status: data.status,
        components: Object.keys(data.components || {}),
        last_webhook: data.lastWebhookReceived,
      });
      return true;
    } else {
      logResult('Health Check', 'FAIL', `Unexpected response: ${response.status}`, data);
      return null;
    }
  } catch (error) {
    logResult('Health Check', 'FAIL', `Network error: ${error}`, null);
    return null;
  }
}

async function testBacktestExport() {
  logStep('Test Backtest Export (GET /api/backtest/export)');

  try {
    console.log(`📊 Exporting backtest data...`);
    const headers: Record<string, string> = {};
    const cookieHeader = buildCookieHeader();
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader.replace('Cookie: ', '');
    }

    const response = await fetch(`${BASE_URL}/api/backtest/export?format=json&limit=10`, {
      headers,
    });

    const data = await response.json();

    if (response.status === 200 && data.count !== undefined) {
      logResult('Backtest Export', 'PASS', `Exported ${data.count} trade(s)`, {
        count: data.count,
        statistics: data.statistics,
        filters: data.filters,
      });
      return true;
    } else {
      logResult('Backtest Export', 'FAIL', `Expected 200, got ${response.status}`, data);
      return null;
    }
  } catch (error) {
    logResult('Backtest Export', 'FAIL', `Network error: ${error}`, null);
    return null;
  }
}

async function runAllTests() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🧪 END-TO-END WORKFLOW TEST`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`API URL: ${BASE_URL}`);
  console.log(`Start Time: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })} ADL`);
  console.log();

  // Test 1: Health check
  await testHealthCheck();

  // Test 2: Send alert webhook
  const tradeId = await testAlertWebhook('EURUSD', 'long');

  // Test 3: Direct approval by ID (skip list query for speed)
  if (tradeId) {
    await testApprovalEndpoint(tradeId);  // Use trade_id directly from webhook response
  }

  // Test 4: List pending trades (verify queue still works)
  await testPendingQueueList();

  // Test 5: Authentication & Backtest export
  const authenticated = await testLogin();
  if (authenticated) {
    await testBacktestExport();
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${'═'.repeat(70)}`);

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`\n✅ PASSED: ${passed}/${total}`);
  console.log(`❌ FAILED: ${failed}/${total}`);
  console.log(`\nDetailed Results:`);
  results.forEach(r => {
    const emoji = r.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${emoji} ${r.step}: ${r.message}`);
  });

  console.log(`\n🏁 End Time: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })} ADL`);
  console.log(`${'═'.repeat(70)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
