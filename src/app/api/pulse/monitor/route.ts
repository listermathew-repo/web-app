/**
 * GET /api/pulse/monitor
 * Continuous stage monitoring - runs every 1-2 minutes
 * Progresses setups through: detected → standby → ready → signal_ready → trigger_ready → executing → executed
 *
 * Call this endpoint every 1-2 minutes (via cron or frontend interval)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedPulseEngine } from '@/lib/advanced-pulse-engine';
import { sendAlert } from '@/lib/alerts';

interface StageMonitorResponse {
  status: 'ok' | 'error';
  timestamp: string;
  adl_hour: number;
  setups_by_stage: {
    detected: number;
    standby: number;
    ready: number;
    signal_ready: number;
    trigger_ready: number;
    executing: number;
    executed: number;
    missed: number;
  };
  active_setups: number;
  setups_in_entry_window: number;
  details: Array<{
    id: string;
    symbol: 'BTCUSD' | 'EURUSD';
    direction: 'long' | 'short';
    current_stage: string;
    progress: string;
    confidence: number;
    entry_window_remaining_seconds?: number;
  }>;
  error?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const engine = getAdvancedPulseEngine();

    // Get current ADL time
    const now = new Date();
    const adlHours = now.getUTCHours() + 9;
    const adlHour = adlHours % 24;

    console.log(`[MONITOR] Stage check at ${adlHour}:00 ADL`);

    // Run stage monitoring for all active setups
    await engine.monitorActiveSetups();

    // Get all setups and group by stage
    const allSetups = engine.getCachedSetups();
    const byStage = {
      detected: engine.getSetupByStage('detected').length,
      standby: engine.getSetupByStage('standby').length,
      ready: engine.getSetupByStage('ready').length,
      signal_ready: engine.getSetupByStage('signal_ready').length,
      trigger_ready: engine.getSetupByStage('trigger_ready').length,
      executing: engine.getSetupByStage('executing').length,
      executed: engine.getSetupByStage('executed').length,
      missed: engine.getSetupByStage('missed').length,
    };

    // Count active setups (anything not executed or missed)
    const activeSetups = allSetups.filter(
      (s) => s.stage !== 'executed' && s.stage !== 'missed'
    );

    // Count setups in entry window (confirmed on 5M, waiting for 3M/2M/1M)
    const inEntryWindow = activeSetups.filter(
      (s) =>
        s.entryWindowStart &&
        s.entryWindowEnd &&
        new Date() >= new Date(s.entryWindowStart) &&
        new Date() <= new Date(s.entryWindowEnd)
    );

    // Build details for response
    const details = activeSetups.slice(0, 10).map((setup) => {
      const confidence =
        setup.confidence.trigger_2m_1m ||
        setup.confidence.precision_3m ||
        setup.confidence.confirmed_5m ||
        setup.confidence.confirmed_10m ||
        setup.confidence.initial_15m;

      const entryWindowRemaining = setup.entryWindowEnd
        ? Math.max(
            0,
            Math.floor((new Date(setup.entryWindowEnd).getTime() - Date.now()) / 1000)
          )
        : undefined;

      const stageProgressMap: Record<string, string> = {
        detected: '15M detected → Awaiting user approval',
        standby: '✓ User approved → Checking 10M structure',
        ready: '✓ 10M confirmed → Checking 5M value',
        signal_ready: '✓ Entry window open → Monitoring 3M entry',
        precision_pending: '✓ 3M monitoring → Ready for 2M/1M',
        trigger_ready: '🎯 STANDBY for 2M/1M confirmation',
        executing: '⚡ Executing trade...',
        executed: '✅ Trade executed',
        missed: '❌ Missed/expired',
      };

      return {
        id: setup.id,
        symbol: setup.symbol,
        direction: setup.direction,
        current_stage: setup.stage,
        progress: stageProgressMap[setup.stage] || 'Unknown',
        confidence: Math.round(confidence),
        entry_window_remaining_seconds: entryWindowRemaining,
      };
    });

    const duration = Date.now() - startTime;

    const response: StageMonitorResponse = {
      status: 'ok',
      timestamp: now.toISOString(),
      adl_hour: adlHour,
      setups_by_stage: byStage,
      active_setups: activeSetups.length,
      setups_in_entry_window: inEntryWindow.length,
      details,
    };

    console.log(
      `[MONITOR] Complete in ${duration}ms. Active: ${activeSetups.length}, In entry window: ${inEntryWindow.length}`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[MONITOR] Error:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);
    await sendAlert('error', `🔴 STAGE MONITOR ERROR: ${errorMsg}`);

    return NextResponse.json<StageMonitorResponse>(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        adl_hour: 0,
        setups_by_stage: {
          detected: 0,
          standby: 0,
          ready: 0,
          signal_ready: 0,
          trigger_ready: 0,
          executing: 0,
          executed: 0,
          missed: 0,
        },
        active_setups: 0,
        setups_in_entry_window: 0,
        details: [],
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
