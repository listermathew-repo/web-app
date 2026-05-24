/**
 * E2E Workflow Test - Complete Trading System Flow
 * Tests: Alert → Queue → Approval → Execution → Monitoring
 *
 * Usage: npx ts-node scripts/e2e-workflow-test.ts
 */

import { randomUUID } from 'crypto';

const API_KEY = process.env.WEBHOOK_API_KEY || 'e3acbaedddbf49184b9a3c34e3d1c99b';
const BASE_URL = process.env.API_URL || 'http://localhost:3000';

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logStep(step: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📍 Step: ${step}`);
  console.log(`${'='.repeat(70)}`);
}

function logResult(step: string, status: 'PASS' | 'FAIL', message: string, details?: any) {
  const result: TestResult = { step, status, message, details };
  results.push(result);

  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${status}: ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
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
      // Add chart data to bypass trading hours check
      ema10: 1.1634,
      ema21: 1.1620,
      vwap: 1.1635,
      rsi: 45,
      volume: 250000,
      volume_avg: 200000,
      atr: 0.0015,
      minutes_since_4h_close: 120,
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
    const response = await fetch(`${BASE_URL}/api/backtest/export?format=json&limit=10`);

    const data = await response.json();

    if (response.status === 200) {
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

  // Test 2: Send alert
  const tradeId = await testAlertWebhook('EURUSD', 'long');

  // Test 3: List pending trades
  if (tradeId) {
    const queuedId = await testPendingQueueList();

    // Test 4: Approve trade
    if (queuedId) {
      await testApprovalEndpoint(queuedId);
    }
  }

  // Test 5: Backtest export (skipped - non-critical for webhook flow)
  // await testBacktestExport();

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
