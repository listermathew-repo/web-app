import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbOps } from '@/lib/db';
import { sendAlert } from '@/lib/alerts';
import { validateTrade, validateTradeWithRules, logValidation, formatValidationReport } from '@/lib/trade-validator';
import { checkRateLimit } from '@/lib/rate-limiter';
import { createRequestContext, logWithContext, formatContextForResponse } from '@/lib/request-context';
import { randomUUID } from 'crypto';

// Validation schema for incoming webhook - HARDENED
const TradeAlertSchema = z.object({
  // Symbol: Only alphanumeric, max 20 chars, must match forex/crypto/stock pattern
  symbol: z.string()
    .min(2, 'Symbol too short')
    .max(20, 'Symbol too long')
    .regex(/^[A-Z0-9:]+$/, 'Symbol must be uppercase alphanumeric with optional colon (e.g. EURUSD, NYMEX:CL1)')
    .transform(s => s.toUpperCase()),

  direction: z.enum(['long', 'short']),

  // Entry level: positive, reasonable bounds for forex/crypto/stocks
  entry_level: z.number()
    .positive('Entry level must be positive')
    .min(0.00001, 'Entry level too small')
    .max(1000000, 'Entry level too large')
    .finite('Entry level must be finite'),

  // Stop level: positive, reasonable bounds
  stop_level: z.number()
    .positive('Stop level must be positive')
    .min(0.00001, 'Stop level too small')
    .max(1000000, 'Stop level too large')
    .finite('Stop level must be finite'),

  // Retap level: optional but validated
  retap_level: z.number()
    .positive('Retap level must be positive')
    .min(0.00001, 'Retap level too small')
    .max(1000000, 'Retap level too large')
    .finite('Retap level must be finite')
    .optional(),

  // Risk amount: optional, reasonable dollar amount
  risk_amount: z.number()
    .positive('Risk amount must be positive')
    .min(10, 'Risk amount too small')
    .max(10000, 'Risk amount exceeds max per-trade limit')
    .finite('Risk amount must be finite')
    .optional(),

  // Scenario: optional, max 100 chars to prevent injection
  scenario: z.string()
    .max(100, 'Scenario description too long')
    .optional(),

  // Chart confirmation data from Pine Script - all optional but validated
  ema10: z.number()
    .positive('EMA10 must be positive')
    .min(0.00001, 'EMA10 too small')
    .max(1000000, 'EMA10 too large')
    .finite('EMA10 must be finite')
    .optional(),

  ema21: z.number()
    .positive('EMA21 must be positive')
    .min(0.00001, 'EMA21 too small')
    .max(1000000, 'EMA21 too large')
    .finite('EMA21 must be finite')
    .optional(),

  vwap: z.number()
    .positive('VWAP must be positive')
    .min(0.00001, 'VWAP too small')
    .max(1000000, 'VWAP too large')
    .finite('VWAP must be finite')
    .optional(),

  // RSI: 0-100 range enforced
  rsi: z.number()
    .min(0, 'RSI minimum is 0')
    .max(100, 'RSI maximum is 100')
    .finite('RSI must be finite')
    .optional(),

  // Volume: positive, reasonable bounds (millions)
  volume: z.number()
    .positive('Volume must be positive')
    .min(1, 'Volume minimum is 1')
    .max(10000000, 'Volume exceeds reasonable bounds')
    .finite('Volume must be finite')
    .optional(),

  // Volume average: positive, reasonable bounds
  volume_avg: z.number()
    .positive('Volume average must be positive')
    .min(1, 'Volume average minimum is 1')
    .max(10000000, 'Volume average exceeds reasonable bounds')
    .finite('Volume average must be finite')
    .optional(),

  // ATR: positive, reasonable bounds for price movement
  atr: z.number()
    .positive('ATR must be positive')
    .min(0.00001, 'ATR too small')
    .max(10000, 'ATR exceeds reasonable bounds')
    .finite('ATR must be finite')
    .optional(),

  // Minutes since 4h close: non-negative, max 1440 minutes (24 hours)
  minutes_since_4h_close: z.number()
    .nonnegative('Minutes since 4h close cannot be negative')
    .max(1440, 'Minutes since 4h close exceeds 24 hours')
    .int('Minutes must be integer')
    .finite('Minutes must be finite')
    .optional(),
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
  let ctx = createRequestContext(); // Track this request

  try {
    // 1. Authenticate with X-API-Key header
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
      logWithContext(ctx, 'Unauthorized webhook attempt');
      await sendAlert('error', '🔐 WEBHOOK AUTH FAILED - Invalid API key');
      return NextResponse.json(
        { error: 'Unauthorized', ...formatContextForResponse(ctx) },
        { status: 401 }
      );
    }

    // 2. Check rate limit (10 requests per minute per API key)
    if (!checkRateLimit(apiKey, 10, 60000)) {
      logWithContext(ctx, 'Rate limit exceeded');
      return NextResponse.json(
        { error: 'Rate limit exceeded (10 req/min)', ...formatContextForResponse(ctx) },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 3. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      logWithContext(ctx, 'Failed to parse webhook body', error);
      await sendAlert('error', '🔴 WEBHOOK ERROR - Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload', ...formatContextForResponse(ctx) },
        { status: 400 }
      );
    }

    // 4. Validate with Zod schema
    let alert: TradeAlert;
    try {
      alert = TradeAlertSchema.parse(body);
    } catch (error) {
      logWithContext(ctx, 'Webhook validation error', error);
      await sendAlert('error', `🔴 WEBHOOK VALIDATION ERROR - ${error}`);
      return NextResponse.json(
        { error: 'Invalid alert schema', ...formatContextForResponse(ctx) },
        { status: 400 }
      );
    }

    // 5. Check for duplicate trades (rate limiting)
    try {
      const allTrades = dbOps.getPendingTrades();
      const recent = allTrades.filter(
        (t: any) =>
          t.symbol === alert.symbol &&
          t.direction === alert.direction &&
          new Date(t.created_at).getTime() > Date.now() - 30000 // within 30 seconds
      );

      if (recent.length > 0) {
        logWithContext(ctx, `Duplicate trade detected`, { symbol: alert.symbol, direction: alert.direction });
        await sendAlert('warning', `🚫 DUPLICATE TRADE - ${alert.symbol} ${alert.direction} within 30s [${ctx.requestId}]`);
        return NextResponse.json(
          { error: 'Duplicate trade within 30 seconds', ...formatContextForResponse(ctx) },
          { status: 429 }
        );
      }
    } catch (error) {
      logWithContext(ctx, 'Duplicate check error', error);
      await sendAlert('error', `💾 DATABASE ERROR - Cannot check for duplicates [${ctx.requestId}]`);
      return NextResponse.json(
        { error: 'Database error', ...formatContextForResponse(ctx) },
        { status: 500 }
      );
    }

    // 6. VALIDATE TRADE against 10-point entry checklist
    const tradeId = randomUUID();
    let validationResult: any;
    ctx.tradeId = tradeId;
    ctx.symbol = alert.symbol;
    ctx.direction = alert.direction;

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

        logWithContext(ctx, 'Trade validation failed', { reason: validationResult.rejectionReasons });
        return NextResponse.json(
          {
            status: 'rejected',
            trade_id: tradeId,
            symbol: alert.symbol,
            reason: validationResult.rejectionReasons.join(', '),
            ...formatContextForResponse(ctx),
          },
          { status: 400 }
        );
      }

      // Validation passed - proceed to queue trade
      logWithContext(ctx, 'Trade validation passed');
    } catch (error) {
      logWithContext(ctx, 'Trade validation error', error);
      await sendAlert('error', `⚠️ VALIDATION ERROR - ${error} [${ctx.requestId}]`);
      return NextResponse.json(
        { error: 'Validation error', ...formatContextForResponse(ctx) },
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
        `✅ TRADE QUEUED [${ctx.requestId}]: ${alert.symbol} ${direction} @ ${alert.entry_level}\nApprove in web app → /api/pending`
      );

      logWithContext(ctx, 'Trade queued successfully');

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
          ...formatContextForResponse(ctx),
        },
        { status: 202 }
      );
    } catch (error) {
      logWithContext(ctx, 'Failed to queue trade', error);
      await sendAlert('error', `💾 DATABASE ERROR - Cannot save trade: ${error} [${ctx.requestId}]`);
      return NextResponse.json(
        { error: 'Failed to queue trade', ...formatContextForResponse(ctx) },
        { status: 500 }
      );
    }
  } catch (error) {
    logWithContext(ctx, 'Unexpected webhook error', error);
    await sendAlert('error', `⚠️ WEBHOOK UNEXPECTED ERROR - ${error} [${ctx.requestId}]`);
    return NextResponse.json(
      { error: 'Internal server error', ...formatContextForResponse(ctx) },
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
