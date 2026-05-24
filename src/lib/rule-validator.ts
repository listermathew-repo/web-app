/**
 * Rule Validator Engine
 * Reads trading-rules.json and evaluates trades against configurable rules
 * Supports rule versioning and audit trails
 */

import tradingRules from './trading-rules.json';

export interface RuleCondition {
  id: string;
  name: string;
  passed: boolean;
  value?: any;
  reason?: string;
}

export interface RuleEvaluation {
  rule_version: string;
  rule_name: string;
  direction: 'long' | 'short';
  conditions_evaluated: RuleCondition[];
  conditions_passed: number;
  conditions_total: number;
  all_conditions_met: boolean;
  pre_entry_checks: Record<string, boolean>;
  entry_valid: boolean;
  recommendation: 'ACCEPT' | 'REJECT';
  rejection_reasons: string[];
  rr_ratio: number;
  rr_sufficient: boolean;
  market_context: {
    price?: number;
    vwap?: number;
    ema10?: number;
    ema21?: number;
    ema20?: number;
    rsi?: number;
    atr?: number;
  };
}

/**
 * Evaluate a trade against the current rule set
 */
export async function evaluateTradeAgainstRules(
  direction: 'long' | 'short',
  context: {
    symbol: string;
    entry_price: number;
    stop_price: number;
    retap_level?: number;
    price?: number;
    vwap?: number;
    ema10?: number;
    ema21?: number;
    ema20?: number;
    rsi?: number;
    atr?: number;
    open_positions?: number;
    account_size?: number;
    risk_amount?: number;
    daily_losses_count?: number;
    daily_profit?: number;
    minutes_since_ny_open?: number;
  }
): Promise<RuleEvaluation> {
  const rules = tradingRules as any;
  const entrySignals = rules.entry_signals[direction === 'long' ? 'long_entry' : 'short_entry'];

  const evaluation: RuleEvaluation = {
    rule_version: rules.version,
    rule_name: rules.name,
    direction,
    conditions_evaluated: [],
    conditions_passed: 0,
    conditions_total: entrySignals.conditions.length,
    all_conditions_met: false,
    pre_entry_checks: {},
    entry_valid: false,
    recommendation: 'REJECT',
    rejection_reasons: [],
    rr_ratio: 0,
    rr_sufficient: false,
    market_context: {
      price: context.price,
      vwap: context.vwap,
      ema10: context.ema10,
      ema21: context.ema21,
      ema20: context.ema20,
      rsi: context.rsi,
      atr: context.atr,
    },
  };

  // ===== STEP 1: Evaluate the 4 Entry Conditions =====
  for (const condition of entrySignals.conditions) {
    let passed = false;
    let reason = '';

    switch (condition.id) {
      case 'price_vwap':
        // Price within ±0.5 SD of VWAP
        if (context.vwap && context.price) {
          const tolerance = context.atr ? context.atr * 0.5 : 0.0005; // 0.5 * ATR or 5 pips default
          const diff = Math.abs(context.price - context.vwap);
          passed = diff <= tolerance;
          reason = `Price ${context.price?.toFixed(5)} ${
            passed ? 'within' : 'outside'
          } ±${tolerance.toFixed(5)} of VWAP ${context.vwap?.toFixed(5)}`;
        } else {
          reason = 'VWAP or price data missing';
        }
        break;

      case 'rsi_band':
        // RSI between 40-60
        if (context.rsi !== undefined) {
          passed = context.rsi >= 40 && context.rsi <= 60;
          reason = `RSI ${context.rsi.toFixed(1)} ${
            passed ? 'within' : 'outside'
          } 40-60 band`;
        } else {
          reason = 'RSI data missing';
        }
        break;

      case 'ema_cross':
        // EMA10 > EMA21 (long) or EMA10 < EMA21 (short)
        if (context.ema10 !== undefined && context.ema21 !== undefined) {
          if (direction === 'long') {
            passed = context.ema10 > context.ema21;
            reason = `EMA10 ${context.ema10?.toFixed(5)} ${
              passed ? '>' : '<='
            } EMA21 ${context.ema21?.toFixed(5)}`;
          } else {
            passed = context.ema10 < context.ema21;
            reason = `EMA10 ${context.ema10?.toFixed(5)} ${
              passed ? '<' : '>='
            } EMA21 ${context.ema21?.toFixed(5)}`;
          }
        } else {
          reason = 'EMA data missing';
        }
        break;

      case 'cascade':
        // Price > 20 EMA (long) or Price < 20 EMA (short)
        if (context.price !== undefined && context.ema20 !== undefined) {
          if (direction === 'long') {
            passed = context.price > context.ema20;
            reason = `Price ${context.price?.toFixed(5)} ${
              passed ? '>' : '<='
            } 20EMA ${context.ema20?.toFixed(5)}`;
          } else {
            passed = context.price < context.ema20;
            reason = `Price ${context.price?.toFixed(5)} ${
              passed ? '<' : '>='
            } 20EMA ${context.ema20?.toFixed(5)}`;
          }
        } else {
          reason = 'Price or 20EMA data missing';
        }
        break;
    }

    evaluation.conditions_evaluated.push({
      id: condition.id,
      name: condition.name,
      passed,
      reason,
    });

    if (passed) evaluation.conditions_passed++;
  }

  evaluation.all_conditions_met = evaluation.conditions_passed === evaluation.conditions_total;

  if (!evaluation.all_conditions_met) {
    evaluation.rejection_reasons.push(
      `Only ${evaluation.conditions_passed}/${evaluation.conditions_total} entry conditions met`
    );
  }

  // ===== STEP 2: Evaluate Pre-Entry Checks =====
  for (const check of rules.pre_entry_checks) {
    let checkPassed = true;
    const checkKey = check.id;

    switch (check.id) {
      case 'ny_open':
        checkPassed =
          context.minutes_since_ny_open === undefined ||
          context.minutes_since_ny_open >= 15;
        if (!checkPassed) {
          evaluation.rejection_reasons.push(
            `⏰ Too close to NY Open (${context.minutes_since_ny_open} min after)`
          );
        }
        break;

      case 'position_limit':
        checkPassed = !context.open_positions || context.open_positions < 2;
        if (!checkPassed) {
          evaluation.rejection_reasons.push(
            `📊 Position limit reached (${context.open_positions} open)`
          );
        }
        break;

      case 'risk_per_trade':
        if (context.account_size && context.risk_amount) {
          const riskPct = (context.risk_amount / context.account_size) * 100;
          checkPassed = riskPct >= 0.25 && riskPct <= 1.0;
          if (!checkPassed) {
            evaluation.rejection_reasons.push(
              `💰 Risk ${riskPct.toFixed(2)}% outside 0.25%-1% range`
            );
          }
        }
        break;

      case 'daily_loss_limit':
        checkPassed = !context.daily_losses_count || context.daily_losses_count < 2;
        if (!checkPassed) {
          evaluation.rejection_reasons.push(
            `🔴 Daily loss limit reached (${context.daily_losses_count} losses)`
          );
        }
        break;

      case 'daily_profit_cap':
        if (context.daily_profit !== undefined) {
          const dailyProfitPct = (context.daily_profit / (context.account_size || 1)) * 100;
          checkPassed = dailyProfitPct < 3.0;
          if (!checkPassed) {
            evaluation.rejection_reasons.push(
              `🤑 Daily profit target reached (${dailyProfitPct.toFixed(2)}%)`
            );
          }
        }
        break;
    }

    evaluation.pre_entry_checks[checkKey] = checkPassed;
  }

  const all_pre_entry_checks_pass = Object.values(evaluation.pre_entry_checks).every(
    (v) => v === true
  );

  // ===== STEP 3: Calculate Risk/Reward =====
  const entryPrice = context.entry_price;
  const stopPrice = context.stop_price;
  const targetPrice = context.retap_level;

  if (entryPrice && stopPrice && targetPrice) {
    const riskDistance = Math.abs(entryPrice - stopPrice);
    const rewardDistance = Math.abs(targetPrice - entryPrice);
    evaluation.rr_ratio = rewardDistance / riskDistance;
    evaluation.rr_sufficient = evaluation.rr_ratio >= 2.0; // Minimum 1:2
  }

  if (!evaluation.rr_sufficient) {
    evaluation.rejection_reasons.push(
      `📉 Risk/Reward ratio ${evaluation.rr_ratio.toFixed(2)}:1 below 2:1 minimum`
    );
  }

  // ===== STEP 4: Final Decision =====
  evaluation.entry_valid =
    evaluation.all_conditions_met && all_pre_entry_checks_pass && evaluation.rr_sufficient;

  if (evaluation.entry_valid) {
    evaluation.recommendation = 'ACCEPT';
  } else {
    evaluation.recommendation = 'REJECT';
  }

  return evaluation;
}

/**
 * Get the current rule version
 */
export function getCurrentRuleVersion(): string {
  return (tradingRules as any).version;
}

/**
 * Get rule name
 */
export function getRuleName(): string {
  return (tradingRules as any).name;
}

/**
 * Format rule evaluation for display
 */
export function formatRuleEvaluation(evaluation: RuleEvaluation): string {
  let output = `
═══════════════════════════════════════════════════════════
  TRADE EVALUATION AGAINST RULES v${evaluation.rule_version}
═══════════════════════════════════════════════════════════

📋 Rule Set: ${evaluation.rule_name}
🔀 Direction: ${evaluation.direction.toUpperCase()}
🎯 Recommendation: ${evaluation.recommendation}

───────────────────────────────────────────────────────────
  4 ENTRY CONDITIONS (${evaluation.conditions_passed}/${evaluation.conditions_total} passed)
───────────────────────────────────────────────────────────
`;

  for (const cond of evaluation.conditions_evaluated) {
    const icon = cond.passed ? '✅' : '❌';
    output += `${icon} ${cond.name}: ${cond.reason}\n`;
  }

  output += `
───────────────────────────────────────────────────────────
  PRE-ENTRY CHECKS
───────────────────────────────────────────────────────────
`;

  for (const [key, passed] of Object.entries(evaluation.pre_entry_checks)) {
    const icon = passed ? '✅' : '❌';
    output += `${icon} ${key}\n`;
  }

  output += `
───────────────────────────────────────────────────────────
  RISK/REWARD ANALYSIS
───────────────────────────────────────────────────────────
Risk/Reward Ratio: ${evaluation.rr_ratio.toFixed(2)}:1 ${evaluation.rr_sufficient ? '✅ (≥2:1)' : '❌ (<2:1)'}

`;

  if (evaluation.rejection_reasons.length > 0) {
    output += `───────────────────────────────────────────────────────────
  REJECTION REASONS
───────────────────────────────────────────────────────────
`;
    for (const reason of evaluation.rejection_reasons) {
      output += `• ${reason}\n`;
    }
  }

  output += `═══════════════════════════════════════════════════════════\n`;

  return output;
}

/**
 * Export rule set for documentation
 */
export function exportRuleSet(): any {
  return tradingRules;
}
