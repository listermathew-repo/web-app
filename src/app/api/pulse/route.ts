/**
 * GET /api/pulse
 * Triggers 15-minute FVG pulse point checks for BTCUSD + EURUSD
 * Detects new FVG formations and queues them for approval
 *
 * Called every 15 minutes during 09:00-22:00 ADL window
 */

import { NextResponse } from 'next/server';
import { getPulsePointEngine } from '@/lib/pulse-point-engine';
import { sendAlert } from '@/lib/alerts';

interface PulseResponse {
  status: 'ok' | 'idle' | 'error';
  timestamp: string;
  adl_hour: number;
  trading_active: boolean;
  peak_window: boolean;
  setups_detected: number;
  instruments: {
    symbol: 'BTCUSD' | 'EURUSD';
    setups: number;
    confidence: {
      high: number;
      medium: number;
      low: number;
    };
  }[];
  next_pulse_in_seconds: number;
  error?: string;
}

export async function GET() {
  const startTime = Date.now();

  try {
    const engine = getPulsePointEngine();

    // Get current ADL time
    const now = new Date();
    const adlHours = now.getUTCHours() + 9;
    const adlMinutes = now.getUTCMinutes() + 30;
    const adlHour = adlHours % 24;
    const tradingActive = adlHour >= 9 && adlHour < 22;
    const isPeakWindow = engine.isPeakWindow();

    console.log(
      `[PULSE API] Check at ${adlHour}:${String(adlMinutes % 60).padStart(2, '0')} ADL (Trading: ${tradingActive}, Peak: ${isPeakWindow})`
    );

    // If outside trading hours, return early
    if (!tradingActive) {
      return NextResponse.json<PulseResponse>(
        {
          status: 'idle',
          timestamp: now.toISOString(),
          adl_hour: adlHour,
          trading_active: false,
          peak_window: false,
          setups_detected: 0,
          instruments: [],
          next_pulse_in_seconds: Math.max(
            1,
            (24 - adlHour) * 3600 + 9 * 3600 // Next trading day 9am
          ),
        },
        { status: 200 }
      );
    }

    // Run pulse point checks for both instruments
    const btcSetups = await engine.runPulsePoint('BTCUSD');
    const eurSetups = await engine.runPulsePoint('EURUSD');

    const totalSetups = btcSetups.length + eurSetups.length;

    // Count confidence levels
    const btcConfidence = {
      high: btcSetups.filter(s => s.confidence === 'high').length,
      medium: btcSetups.filter(s => s.confidence === 'medium').length,
      low: btcSetups.filter(s => s.confidence === 'low').length,
    };

    const eurConfidence = {
      high: eurSetups.filter(s => s.confidence === 'high').length,
      medium: eurSetups.filter(s => s.confidence === 'medium').length,
      low: eurSetups.filter(s => s.confidence === 'low').length,
    };

    // Log and notify if setups detected during peak window
    if (totalSetups > 0 && isPeakWindow) {
      const summary = `
🚨 PULSE POINT RESULTS - Peak Window 2pm-4pm ADL

BTCUSD: ${btcSetups.length} setups
  - High confidence: ${btcConfidence.high}
  - Medium confidence: ${btcConfidence.medium}

EURUSD: ${eurSetups.length} setups
  - High confidence: ${eurConfidence.high}
  - Medium confidence: ${eurConfidence.medium}

Total to review: ${totalSetups}
Expected monthly: 55-99 setups
Expected P&L: $46,900 - $91,350 at $350 risk
      `;
      await sendAlert({ type: 'success', message: summary, tags: ['pulse', 'summary'] });
    }

    const duration = Date.now() - startTime;

    const response: PulseResponse = {
      status: totalSetups > 0 ? 'ok' : 'idle',
      timestamp: now.toISOString(),
      adl_hour: adlHour,
      trading_active: true,
      peak_window: isPeakWindow,
      setups_detected: totalSetups,
      instruments: [
        {
          symbol: 'BTCUSD',
          setups: btcSetups.length,
          confidence: btcConfidence,
        },
        {
          symbol: 'EURUSD',
          setups: eurSetups.length,
          confidence: eurConfidence,
        },
      ],
      next_pulse_in_seconds: 900, // 15 minutes
    };

    console.log(
      `[PULSE API] Complete in ${duration}ms. Setups: ${totalSetups}. Next check in 15 min.`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[PULSE API] Error:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);
    await sendAlert({ type: 'error', message: `🔴 PULSE POINT API ERROR: ${errorMsg}`, tags: ['pulse', 'error'] });

    return NextResponse.json<PulseResponse>(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        adl_hour: 0,
        trading_active: false,
        peak_window: false,
        setups_detected: 0,
        instruments: [],
        next_pulse_in_seconds: 900,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
