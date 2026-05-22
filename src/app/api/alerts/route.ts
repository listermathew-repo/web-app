import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbOps } from '@/lib/db';
import { sendAlert } from '@/lib/alerts';
import { validateTrade, validateTradeWithRules, logValidation, formatValidationReport } from '@/lib/trade-validator';
import { randomUUID } from 'crypto';

// Validation schema for incoming webhook
const TradeAlertSchema = z.object({
  symbol: z.string().min(1),
  direction: z.enum(['long', 'short']),
  entry_level: z.number().positive(),
  stop_level: z.number().positive(),
  retap_level: z.number().positive().optional(),
  risk_amount: z.number().positive().optional(),
  scenario: z.string().optional(),
  // Chart confirmation data from Pine Script
  ema10: z.number().optional(),
  ema21: z.number().optional(),
  vwap: z.number().optional(),
  rsi: z.number().min(0).max(100).optional(), // RSI 0-100 range
  volume: z.number().positive().optional(),
  volume_avg: z.number().positive().optional(),
  atr: z.number().positive().optional(),
  minutes_since_4h_close: z.number().nonnegative().optional(),
});

type TradeAlert = z.infer<typeof TradeAlertSchema>;

// GET /api/alerts - Serve dynamic alert levels (existing functionality)
export async function GET() {
  try {
    // Return dynamic alert levels from rules.json or database
    // For now, return hardcoded defaults
    return NextResponse.json(
      {
        eurusd: {
          breakout: 1.16353,
          retap: 1.16260,
          stop: 1.1617,
        },
        xauusd: {
          breakout: 4570.895,
          retap: 4555.0,
          stop: 4534.74,
        },
        btcusd: {
          breakout: 78103,
          retap: 77950,
          stop: 77155,
        },
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert levels' },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Receive trade alerts from TradingView
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate with X-API-Key header
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
      console.warn('Unauthorized webhook attempt: Invalid API key');
      await sendAlert('error', '🔐 WEBHOOK AUTH FAILED - Invalid API key');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse webhook body:', error);
      await sendAlert('error', '🔴 WEBHOOK ERROR - Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // 3. Validate with Zod schema
    let alert: TradeAlert;
    try {
      alert = TradeAlertSchema.parse(body);
    } catch (error) {
      console.error('Webhook validation error:', error);
      await sendAlert('error', `🔴 WEBHOOK VALIDATION ERROR - ${error}`);
      return NextResponse.json(
        { error: 'Invalid alert schema' },
        { status: 400 }
      );
    }

    // 4. Check for duplicate trades (rate limiting)
    try {
      const allTrades = dbOps.getPendingTrades();
      const recent = allTrades.filter(
        (t: any) =>
          t.symbol === alert.symbol &&
          t.direction === alert.direction &&
          new Date(t.created_at).getTime() > Date.now() - 30000 // within 30 seconds
      );

      if (recent.length > 0) {
        console.warn(`Duplicate trade detected: ${alert.symbol} ${alert.direction}`);
        await sendAlert('warning', `🚫 DUPLICATE TRADE - ${alert.symbol} ${alert.direction} within 30s`);
        return NextResponse.json(
          { error: 'Duplicate trade within 30 seconds' },
          { status: 429 }
        );
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
      await sendAlert('error', `💾 DATABASE ERROR - Cannot check for duplicates`);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // 5. VALIDATE TRADE against 10-point entry checklist
    const tradeId = randomUUID();
    let validationResult: any;

    try {
      const tradeContext = {
        symbol: alert.symbol,
        direction: alert.direction as 'long' | 'short',
        entryLevel: alert.entry_level,
        currentPrice: alert.entry_level, // In real scenario, fetch current price
        stopLevel: alert.stop_level,
        retapLevel: alert.retap_level,
        createdAt: new Date(),
        candle4hClosed: true, // In real scenario, check chart
        // Chart confirmation data from Pine Script
        ema10: alert.ema10,
        ema21: alert.ema21,
        vwap: alert.vwap,
        rsi: alert.rsi,
        volume: alert.volume,
        volumeAvg: alert.volume_avg,
        atr: alert.atr,
        minutesSince4hClose: alert.minutes_since_4h_close,
      };

      validationResult = await validateTradeWithRules(tradeContext);

      // Log validation result with context
      await logValidation(tradeId, alert.symbol, alert.direction, validationResult, tradeContext);

      // If validation fails, REJECT the trade
      if (!validationResult.isValid) {
        const report = formatValidationReport(validationResult);
        console.warn(`Trade rejected: ${tradeId}`, report);

        await sendAlert(
          'error',
          `❌ TRADE REJECTED: ${alert.symbol} ${alert.direction.toUpperCase()}\n\n${report}`
        );

        return NextResponse.json(
          {
            status: 'rejected',
            trade_id: tradeId,
            symbol: alert.symbol,
            reason: validationResult.rejectionReasons.join(', '),
            validation_details: validationResult,
          },
          { status: 400 }
        );
      }

      // Validation passed - proceed to queue trade
      console.log(`Trade validation passed: ${tradeId} - ${alert.symbol}`);
    } catch (error) {
      console.error('Trade validation error:', error);
      await sendAlert('error', `⚠️ VALIDATION ERROR - ${error}`);
      return NextResponse.json(
        { error: 'Validation error' },
        { status: 500 }
      );
    }

    // 6. Queue validated trade for approval
    try {
      dbOps.insertPendingTrade({
        id: tradeId,
        symbol: alert.symbol,
        direction: alert.direction,
        entry_level: alert.entry_level,
        stop_level: alert.stop_level,
        retap_level: alert.retap_level,
        risk_amount: alert.risk_amount || 400,
        scenario: alert.scenario,
      });

      // Store rule evaluation results for audit trail
      if (validationResult.rule_evaluation) {
        dbOps.storeRuleEvaluation(tradeId, validationResult.rule_evaluation);
      }

      // Auto-cleanup expired trades
      dbOps.autoCleanupExpiredTrades();

      // Log the alert
      dbOps.logAlert(alert.symbol, 'entry', alert.entry_level);

      // Send ntfy notification
      const direction = alert.direction.toUpperCase();
      await sendAlert(
        'success',
        `✅ TRADE QUEUED (Validation Passed): ${alert.symbol} ${direction} @ ${alert.entry_level}\nApprove in web app → /api/pending`
      );

      console.log(`Trade queued: ${tradeId} - ${alert.symbol} ${alert.direction}`);

      return NextResponse.json(
        {
          status: 'accepted',
          trade_id: tradeId,
          symbol: alert.symbol,
          direction: alert.direction,
          entry_level: alert.entry_level,
          stop_level: alert.stop_level,
          expires_in_seconds: 300,
          validation_passed: true,
        },
        { status: 202 }
      );
    } catch (error) {
      console.error('Failed to queue trade:', error);
      await sendAlert('error', `💾 DATABASE ERROR - Cannot save trade: ${error}`);
      return NextResponse.json(
        { error: 'Failed to queue trade' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected webhook error:', error);
    await sendAlert('error', `⚠️ WEBHOOK UNEXPECTED ERROR - ${error}`);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS /api/alerts - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
