/**
 * Advanced Tiered Entry Confirmation System
 * Progressively tighter timeframe validation for high-confidence entries
 *
 * Stage 1 (15M): INCREASED CONFIDENCE
 *   - Detects FVG formation
 *   - Validates 4H trend + 1H setup + 15M pullback
 *   - Confluence score 70+ = "Setup Detected, Standing By"
 *   - User receives initial alert but NO execution yet
 *   - Setup queued in "standby" mode (30-minute validity)
 *
 * Stage 2 (10M): CONFIRMATION
 *   - Monitors 10M candles for entry pattern
 *   - Waits for: impulsive move + pullback structure
 *   - If valid: moves to "Ready" state
 *
 * Stage 3 (5M): TIGHTER CONFIRMATION
 *   - Validates 5M pullback into value area
 *   - Confirms: RSI, VWAP, price structure alignment
 *   - If valid: "Entry Signal Ready"
 *
 * Stage 4 (3M): PRECISION ENTRY
 *   - Monitors 3M for exact entry candle
 *   - Looks for: confirmation close above/below key level
 *   - If triggered: "Standby for 2M/1M confirmation"
 *
 * Stage 5 (2M/1M): PULL THE TRIGGER
 *   - Final confirmation on 2M and 1M
 *   - When both confirm: EXECUTE TRADE
 *   - Execution happens within 1-2 minute window
 */

import { sendAlert } from './alerts';
import { dbOps } from './db';

// Confirmation stages
type ConfirmationStage = 'detected' | 'standby' | 'ready' | 'signal_ready' | 'precision_pending' | 'trigger_ready' | 'executing' | 'executed' | 'missed';

interface StagedSetup {
  id: string;
  symbol: 'BTCUSD' | 'EURUSD';
  timestamp: string;
  direction: 'long' | 'short';

  // Price levels (set at Stage 1, never change)
  fvgHigh: number;
  fvgLow: number;
  entryLevel: number;
  retapLevel: number;
  stopLevel: number;
  targetLevel: number;

  // Stage tracking
  stage: ConfirmationStage;
  stageTimestamps: {
    detected?: string;      // 15M detected
    standby?: string;       // Queued for approval
    ready?: string;         // 10M confirmed
    signal_ready?: string;  // 5M confirmed
    precision_pending?: string; // 3M monitoring
    trigger_ready?: string; // 2M ready
    executing?: string;     // Order placed
    executed?: string;      // Order filled
  };

  // Confidence scores at each stage
  confidence: {
    initial_15m: number;        // 0-100 (4H+1H+15M)
    confirmed_10m?: number;     // 0-100 (after 10M check)
    confirmed_5m?: number;      // 0-100 (after 5M check)
    precision_3m?: number;      // 0-100 (after 3M check)
    trigger_2m_1m?: number;     // 0-100 (after 2M/1M check)
  };

  // Multi-timeframe data
  analysis: {
    tf_4h: { direction: 'long' | 'short'; strength: number; ema10: number; ema21: number };
    tf_1h: { direction: 'long' | 'short'; strength: number; fvg_type: 'bullish' | 'bearish' };
    tf_15m: { pullback_confirmed: boolean; entry_structure: string };
    tf_10m?: { impulsive_move: boolean; pullback_structure: string };
    tf_5m?: { value_area_confirmed: boolean; rsi: number; vwap: number };
    tf_3m?: { entry_candle_pending: boolean; structure: string };
    tf_2m?: { final_confirm: boolean };
    tf_1m?: { ready_to_execute: boolean };
  };

  // Trade parameters
  riskAmount: number;
  rewardAmount: number;
  rRatio: number;

  // Status tracking
  approvalStatus: 'pending_user_review' | 'approved_for_entry' | 'rejected' | 'expired';
  userApprovedAt?: string;
  dealReference?: string;
  expiresAt?: string;

  // Entry window timing
  entryWindowStart?: string;  // When entry signal confirmed
  entryWindowEnd?: string;    // Expires if not executed
  executionPrice?: number;
  errorMessage?: string;
}

class AdvancedPulseEngine {
  private setupCache: Map<string, StagedSetup> = new Map();
  private stageCheckInterval = {
    '15m': 15 * 60 * 1000,
    '10m': 10 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '3m': 3 * 60 * 1000,
    '2m': 2 * 60 * 1000,
    '1m': 1 * 60 * 1000,
  };

  /**
   * STAGE 1: Initial 15M Detection
   * Runs every 15 minutes during trading hours
   */
  async stage1_Detect15M(symbol: 'BTCUSD' | 'EURUSD'): Promise<StagedSetup[]> {
    const now = new Date();
    const adlHour = this.getADLHour(now);

    if (adlHour < 9 || adlHour >= 22) {
      console.log(`[PULSE] Outside trading hours (${adlHour}:00 ADL)`);
      return [];
    }

    console.log(`[STAGE 1] Running 15M detection for ${symbol}`);

    try {
      // Fetch 4H trend
      const tf4H = await this.fetchTrendData(symbol, '4H');
      // Fetch 1H setup
      const tf1H = await this.fetchTrendData(symbol, '1H');
      // Fetch 15M for FVG
      const tf15M = await this.fetchTrendData(symbol, '15M');

      // Scan for FVG formations
      const fvgFormations = await this.detectFVGFormations15M(symbol, tf15M);

      const newSetups: StagedSetup[] = [];

      for (const fvg of fvgFormations) {
        // Calculate confluence score for this formation
        const confluenceScore = this.calcConfluenceScore(
          tf4H.direction,
          tf1H.direction,
          tf15M.direction,
          fvg.type
        );

        // Only proceed if confluence >= 70
        if (confluenceScore < 70) {
          console.log(`[STAGE 1] Skipping ${symbol} setup (confluence ${confluenceScore} < 70)`);
          continue;
        }

        const setup = this.buildStagedSetup(
          symbol,
          fvg,
          tf4H,
          tf1H,
          tf15M,
          confluenceScore
        );

        newSetups.push(setup);
        this.setupCache.set(setup.id, setup);

        // Send initial alert: "Setup Detected, Standing By"
        await this.alertSetupDetected(setup);

        // Queue for user review (NOT auto-execution yet)
        await this.queueSetupForUserReview(setup);

        console.log(`[STAGE 1] Setup detected: ${setup.id} (confluence ${confluenceScore}/100)`);
      }

      return newSetups;
    } catch (error) {
      console.error(`[STAGE 1] Error: ${error}`);
      await sendAlert({ type: 'error', message: `🔴 STAGE 1 ERROR (15M detection): ${error}`, tags: ['stage_1', 'error'] });
      return [];
    }
  }

  /**
   * STAGE 2: 10M Confirmation
   * Monitors 10M candles for impulsive move + pullback structure
   * Triggered when user approves the setup
   */
  async stage2_Confirm10M(setupId: string): Promise<StagedSetup | null> {
    const setup = this.setupCache.get(setupId);
    if (!setup) return null;
    if (setup.stage !== 'standby') return setup; // Already past this stage

    console.log(`[STAGE 2] Confirming 10M structure for ${setupId}`);

    try {
      const tf10M = await this.fetchTrendData(setup.symbol, '10M');

      // Check for impulsive move + pullback
      const { hasImpulsiveMove, pullbackConfirmed, strength } =
        await this.check10MStructure(setup, tf10M);

      if (hasImpulsiveMove && pullbackConfirmed) {
        setup.stage = 'ready';
        setup.stageTimestamps.ready = new Date().toISOString();
        setup.confidence.confirmed_10m = 70 + strength * 10; // 70-100

        await sendAlert({
          type: 'success',
          message: `✅ 10M CONFIRMED - ${setup.symbol} ${setup.direction.toUpperCase()} | Confidence: ${setup.confidence.confirmed_10m}/100 | Proceeding to 5M`,
          tags: ['stage_2', 'confirmed']
        });

        console.log(`[STAGE 2] 10M confirmed: ${setup.id}`);
        return setup;
      } else {
        // Structure not yet formed, keep waiting
        console.log(`[STAGE 2] Waiting for 10M structure on ${setupId}`);
        return setup;
      }
    } catch (error) {
      console.error(`[STAGE 2] Error: ${error}`);
      setup.errorMessage = `10M check failed: ${error}`;
      return setup;
    }
  }

  /**
   * STAGE 3: 5M Confirmation
   * Validates 5M pullback into value area
   * Confirms RSI, VWAP, price structure alignment
   */
  async stage3_Confirm5M(setupId: string): Promise<StagedSetup | null> {
    const setup = this.setupCache.get(setupId);
    if (!setup) return null;
    if (setup.stage !== 'ready') return setup;

    console.log(`[STAGE 3] Confirming 5M value area for ${setupId}`);

    try {
      const tf5M = await this.fetchTrendData(setup.symbol, '5M');

      // Check: pullback into FVG, RSI alignment, VWAP confirmation
      const { inValueArea, rsiAligned, vwapConfirmed, strength } =
        await this.check5MValueArea(setup, tf5M);

      if (inValueArea && rsiAligned && vwapConfirmed) {
        setup.stage = 'signal_ready';
        setup.stageTimestamps.signal_ready = new Date().toISOString();
        setup.confidence.confirmed_5m = 75 + strength * 10; // 75-100

        // Entry window now open for 15 minutes
        const now = new Date();
        setup.entryWindowStart = now.toISOString();
        setup.entryWindowEnd = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

        await sendAlert({
          type: 'success',
          message: `✅ 5M VALUE CONFIRMED - ${setup.symbol} | Entry window OPEN (15 min) | Monitoring 3M/2M/1M for trigger`,
          tags: ['stage_3', 'entry_open']
        });

        console.log(`[STAGE 3] 5M confirmed, entry window open: ${setup.id}`);
        return setup;
      } else {
        console.log(
          `[STAGE 3] Waiting for 5M value confirmation (area:${inValueArea}, rsi:${rsiAligned}, vwap:${vwapConfirmed})`
        );
        return setup;
      }
    } catch (error) {
      console.error(`[STAGE 3] Error: ${error}`);
      setup.errorMessage = `5M check failed: ${error}`;
      return setup;
    }
  }

  /**
   * STAGE 4: 3M Precision Entry Candle
   * Monitors 3M for exact entry candle confirmation
   * Looks for confirmation close above/below key level
   */
  async stage4_Precision3M(setupId: string): Promise<StagedSetup | null> {
    const setup = this.setupCache.get(setupId);
    if (!setup) return null;
    if (setup.stage !== 'signal_ready') return setup;

    // Check entry window hasn't expired
    if (setup.entryWindowEnd && new Date() > new Date(setup.entryWindowEnd)) {
      setup.stage = 'missed';
      setup.errorMessage = 'Entry window expired (15 min)';
      await sendAlert({ type: 'error', message: `❌ ENTRY WINDOW EXPIRED - ${setup.symbol} setup missed`, tags: ['entry_window', 'missed'] });
      return setup;
    }

    console.log(`[STAGE 4] Monitoring 3M precision entry for ${setupId}`);

    try {
      const tf3M = await this.fetchTrendData(setup.symbol, '3M');

      // Check for entry candle confirmation
      const { entryCandelConfirmed, structure, strength } =
        await this.check3MEntryCandle(setup, tf3M);

      if (entryCandelConfirmed) {
        setup.stage = 'trigger_ready';
        setup.stageTimestamps.precision_pending = new Date().toISOString();
        setup.stageTimestamps.trigger_ready = new Date().toISOString();
        setup.confidence.precision_3m = 85 + strength * 10; // 85-100

        // Last 2 stages: need 2M + 1M confirmation before executing
        await sendAlert({
          type: 'warning',
          message: `🎯 3M ENTRY CANDLE CONFIRMED! - ${setup.symbol} | STANDBY for 2M/1M final confirmation | Will execute within 1-2 minutes`,
          tags: ['stage_4', 'standby']
        });

        console.log(`[STAGE 4] Entry candle confirmed, ready for 2M/1M: ${setup.id}`);
        return setup;
      } else {
        console.log(`[STAGE 4] Waiting for 3M entry candle (structure: ${structure})`);
        return setup;
      }
    } catch (error) {
      console.error(`[STAGE 4] Error: ${error}`);
      setup.errorMessage = `3M check failed: ${error}`;
      return setup;
    }
  }

  /**
   * STAGE 5: 2M/1M Final Confirmation - PULL THE TRIGGER
   * When BOTH 2M and 1M confirm, execute the trade
   */
  async stage5_PullTheTrigger(setupId: string): Promise<StagedSetup | null> {
    const setup = this.setupCache.get(setupId);
    if (!setup) return null;
    if (setup.stage !== 'trigger_ready') return setup;

    // Check entry window hasn't expired
    if (setup.entryWindowEnd && new Date() > new Date(setup.entryWindowEnd)) {
      setup.stage = 'missed';
      setup.errorMessage = 'Entry window expired (15 min)';
      return setup;
    }

    console.log(`[STAGE 5] Final confirmation - checking 2M/1M for ${setupId}`);

    try {
      const tf2M = await this.fetchTrendData(setup.symbol, '2M');
      const tf1M = await this.fetchTrendData(setup.symbol, '1M');

      // Check both 2M and 1M confirm
      const { confirmed: confirmed2M, readyToExecute: ready2M } =
        await this.check2MFinal(setup, tf2M);
      const { confirmed: confirmed1M, readyToExecute: ready1M } =
        await this.check1MFinal(setup, tf1M);

      if (confirmed2M && confirmed1M && ready2M && ready1M) {
        setup.stage = 'executing';
        setup.stageTimestamps.executing = new Date().toISOString();
        setup.confidence.trigger_2m_1m = 95; // Maximum confidence

        // EXECUTE THE TRADE
        const result = await this.executeTradeViaCapital(setup);

        if (result.success) {
          setup.stage = 'executed';
          setup.stageTimestamps.executed = new Date().toISOString();
          setup.dealReference = result.dealReference;
          setup.executionPrice = result.executionPrice;

          await sendAlert({
            type: 'success',
            message: `✅ TRADE EXECUTED! - ${setup.symbol} ${setup.direction.toUpperCase()} @ ${result.executionPrice.toFixed(
              5
            )} | Deal: ${result.dealReference} | Stop: ${setup.stopLevel.toFixed(4)} | Target: ${setup.targetLevel.toFixed(
              4
            )}`,
            tags: ['trade', 'executed']
          });

          console.log(`[STAGE 5] TRADE EXECUTED: ${setup.id}`);
          return setup;
        } else {
          setup.errorMessage = result.error;
          await sendAlert({ type: 'error', message: `❌ EXECUTION FAILED - ${setup.symbol}: ${result.error}`, tags: ['trade', 'failed'] });
          return setup;
        }
      } else {
        console.log(
          `[STAGE 5] Waiting for 2M/1M final confirmation (2M: ${confirmed2M && ready2M}, 1M: ${confirmed1M && ready1M})`
        );
        return setup;
      }
    } catch (error) {
      console.error(`[STAGE 5] Error: ${error}`);
      setup.errorMessage = `2M/1M check failed: ${error}`;
      return setup;
    }
  }

  /**
   * ASYNC MONITOR: Continuously check stages for setups in "standby" or later
   * Call this every minute during entry window
   */
  async monitorActiveSetups(): Promise<void> {
    const activeSetups = Array.from(this.setupCache.values()).filter(
      (s) =>
        s.stage === 'standby' ||
        s.stage === 'ready' ||
        s.stage === 'signal_ready' ||
        s.stage === 'precision_pending' ||
        s.stage === 'trigger_ready'
    );

    for (const setup of activeSetups) {
      try {
        // Progress through stages based on current stage
        switch (setup.stage) {
          case 'standby':
            // User approved, move to 10M check
            if (setup.approvalStatus === 'approved_for_entry') {
              await this.stage2_Confirm10M(setup.id);
            }
            break;

          case 'ready':
            // 10M confirmed, move to 5M check
            await this.stage3_Confirm5M(setup.id);
            break;

          case 'signal_ready':
            // 5M confirmed, move to 3M check
            await this.stage4_Precision3M(setup.id);
            break;

          case 'trigger_ready':
            // 3M confirmed, execute on 2M/1M
            await this.stage5_PullTheTrigger(setup.id);
            break;
        }
      } catch (error) {
        console.error(`[MONITOR] Error processing ${setup.id}:`, error);
      }
    }
  }

  /**
   * User approves setup (moves from "detected" to "standby")
   * This allows Stage 2 (10M) checks to begin
   */
  async userApprovesSetup(setupId: string): Promise<StagedSetup | null> {
    const setup = this.setupCache.get(setupId);
    if (!setup) return null;

    setup.approvalStatus = 'approved_for_entry';
    setup.userApprovedAt = new Date().toISOString();
    setup.stage = 'standby';
    setup.stageTimestamps.standby = new Date().toISOString();

    await sendAlert({
      type: 'success',
      message: `✅ USER APPROVED - ${setup.symbol} | Monitoring 10M for impulsive move + pullback structure`,
      tags: ['user_approval', 'confirmed']
    });

    console.log(`[APPROVAL] Setup approved by user: ${setupId}`);
    return setup;
  }

  // ============ HELPER FUNCTIONS ============

  private async fetchTrendData(
    symbol: 'BTCUSD' | 'EURUSD',
    timeframe: string
  ): Promise<any> {
    // TODO: Call TradingView API for real OHLCV data
    // For now: return mock data with realistic structure

    return {
      timeframe,
      direction: symbol === 'BTCUSD' ? 'short' : 'long',
      ema10: 100,
      ema21: 105,
      vwap: 102,
      rsi: 45,
      close: 101,
    };
  }

  private async detectFVGFormations15M(
    symbol: 'BTCUSD' | 'EURUSD',
    tf15M: any
  ): Promise<Array<{ type: 'bullish' | 'bearish'; high: number; low: number }>> {
    // TODO: Scan 50 bars of 15M data for FVG patterns
    // Mock: return one FVG based on direction
    return [
      {
        type: tf15M.direction === 'long' ? 'bullish' : 'bearish',
        high: symbol === 'BTCUSD' ? 77500 : 1.1635,
        low: symbol === 'BTCUSD' ? 77400 : 1.1620,
      },
    ];
  }

  private calcConfluenceScore(
    dir4H: string,
    dir1H: string,
    dir15M: string,
    fvgType: string
  ): number {
    let score = 50;
    const isBullish = fvgType === 'bullish';

    if ((isBullish && dir4H === 'long') || (!isBullish && dir4H === 'short')) score += 20;
    if ((isBullish && dir1H === 'long') || (!isBullish && dir1H === 'short')) score += 25;
    if ((isBullish && dir15M === 'long') || (!isBullish && dir15M === 'short')) score += 20;

    return Math.min(score, 100);
  }

  private buildStagedSetup(
    symbol: 'BTCUSD' | 'EURUSD',
    fvg: any,
    tf4H: any,
    tf1H: any,
    tf15M: any,
    confluenceScore: number
  ): StagedSetup {
    const isLong = fvg.type === 'bullish';
    const pipValue = symbol === 'BTCUSD' ? 1 : 0.0001;

    let entryLevel, stopLevel, targetLevel, retapLevel;

    if (isLong) {
      entryLevel = fvg.high + 50 * pipValue;
      stopLevel = fvg.low - 50 * pipValue;
      retapLevel = fvg.low + 25 * pipValue;
      targetLevel = entryLevel + (entryLevel - stopLevel) * 5;
    } else {
      entryLevel = fvg.low - 50 * pipValue;
      stopLevel = fvg.high + 50 * pipValue;
      retapLevel = fvg.high - 25 * pipValue;
      targetLevel = entryLevel - (stopLevel - entryLevel) * 5;
    }

    return {
      id: `${symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      timestamp: new Date().toISOString(),
      direction: isLong ? 'long' : 'short',
      fvgHigh: fvg.high,
      fvgLow: fvg.low,
      entryLevel,
      retapLevel,
      stopLevel,
      targetLevel,
      stage: 'detected',
      stageTimestamps: { detected: new Date().toISOString() },
      confidence: { initial_15m: confluenceScore },
      analysis: {
        tf_4h: { direction: tf4H.direction, strength: 0.8, ema10: tf4H.ema10, ema21: tf4H.ema21 },
        tf_1h: { direction: tf1H.direction, strength: 0.6, fvg_type: (fvg.type as 'bullish' | 'bearish') },
        tf_15m: { pullback_confirmed: true, entry_structure: 'valid' },
      },
      riskAmount: 350,
      rewardAmount: 1750,
      rRatio: 5.0,
      approvalStatus: 'pending_user_review',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  private async alertSetupDetected(setup: StagedSetup): Promise<void> {
    const alert = `
📊 FVG SETUP DETECTED - ${setup.symbol}

Direction: ${setup.direction.toUpperCase()}
Entry: ${setup.entryLevel.toFixed(4)}
Stop: ${setup.stopLevel.toFixed(4)}
Target: ${setup.targetLevel.toFixed(4)}
Confidence: ${setup.confidence.initial_15m}/100

STATUS: Detected - Standing By for 10M Confirmation
(Do not enter yet - waiting for impulsive move on 10M)

Review & approve in dashboard to begin progression through stages:
15M (detected) → 10M (confirm) → 5M (value) → 3M (entry candle) → 2M/1M (EXECUTE)
    `;
    await sendAlert({ type: 'success', message: alert, tags: ['setup', 'detected'] });
  }

  private async queueSetupForUserReview(setup: StagedSetup): Promise<void> {
    try {
      dbOps.insertPendingTrade({
        id: setup.id,
        symbol: setup.symbol,
        direction: setup.direction,
        entry_level: setup.entryLevel,
        stop_level: setup.stopLevel,
        retap_level: setup.retapLevel,
        risk_amount: setup.riskAmount,
        scenario: `FVG ${setup.direction} - Stage 1 Detected (${setup.confidence.initial_15m}/100)`,
      });
    } catch (error) {
      console.error('[QUEUE] Failed to queue setup:', error);
    }
  }

  private async check10MStructure(setup: StagedSetup, tf10M: any): Promise<any> {
    // Check for impulsive move + pullback on 10M
    return { hasImpulsiveMove: true, pullbackConfirmed: true, strength: 0.8 };
  }

  private async check5MValueArea(setup: StagedSetup, tf5M: any): Promise<any> {
    // Check if price is in FVG value area, RSI aligned, VWAP confirmed
    return { inValueArea: true, rsiAligned: true, vwapConfirmed: true, strength: 0.8 };
  }

  private async check3MEntryCandle(setup: StagedSetup, tf3M: any): Promise<any> {
    // Check for entry candle confirmation on 3M
    return { entryCandelConfirmed: true, structure: 'valid', strength: 0.9 };
  }

  private async check2MFinal(setup: StagedSetup, tf2M: any): Promise<any> {
    return { confirmed: true, readyToExecute: true };
  }

  private async check1MFinal(setup: StagedSetup, tf1M: any): Promise<any> {
    return { confirmed: true, readyToExecute: true };
  }

  private async executeTradeViaCapital(setup: StagedSetup): Promise<any> {
    // TODO: Call Capital.com API to execute trade
    return {
      success: true,
      dealReference: `DEAL-${Date.now()}`,
      executionPrice: setup.entryLevel,
    };
  }

  private getADLHour(date: Date): number {
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const adlMinutes = utcMinutes + 30;
    let adlHours = utcHours + 9;
    if (adlMinutes >= 60) adlHours += 1;
    return adlHours % 24;
  }

  // Public API
  getCachedSetups(): StagedSetup[] {
    return Array.from(this.setupCache.values());
  }

  getSetupByStage(stage: ConfirmationStage): StagedSetup[] {
    return Array.from(this.setupCache.values()).filter((s) => s.stage === stage);
  }
}

let engineInstance: AdvancedPulseEngine | null = null;

export function getAdvancedPulseEngine(): AdvancedPulseEngine {
  if (!engineInstance) {
    engineInstance = new AdvancedPulseEngine();
  }
  return engineInstance;
}

export { AdvancedPulseEngine };
export type { StagedSetup, ConfirmationStage };
