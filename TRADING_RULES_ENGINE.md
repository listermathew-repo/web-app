# Trading Rules Engine Documentation

## 📋 Overview

The **Trading Rules Engine** is a configurable system that validates trades against your specific trading rules without requiring code changes. Rules are defined in JSON format and evaluated dynamically at trade time.

**Key Features**:
- ✅ Configurable rules in JSON (not hardcoded)
- ✅ Rule versioning (track which rules were active per trade)
- ✅ Audit trails (store rule evaluation results)
- ✅ Easy updates (change rules, redeploy)
- ✅ A/B testing support (compare rule versions)

---

## 🎯 Your Trading Rules (v1.0)

### Entry Signals: 4 Conditions

#### Long Entry (VWAP + EMA + RSI + Cascade)
```
✅ Condition 1: Price bounces off or holds above VWAP on the 4H
   └─ Tolerance: ±0.5 Standard Deviations

✅ Condition 2: RSI is between 40-60 (not overbought, room to run)
   └─ Neutral zone: avoids extremes

✅ Condition 3: 10 EMA > 21 EMA (Golden Cross - bullish ribbon)
   └─ Moving average alignment shows bullish momentum

✅ Condition 4: Price is above 20 EMA on 4H (cascade confirms UP trend)
   └─ Price must be above baseline EMA
```

**Confirmation**: ALL 4 conditions must be TRUE for valid BUY signal

**Entry Price**: At VWAP or first pullback candle close above VWAP

**Targets**:
- Target 1: VWAP + 1 SD → Take 50% profit
- Target 2: VWAP + 2 SD → Take remaining 50%

**Stop Loss**: Below VWAP - 0.5 SD OR below 20 EMA (whichever is lower)

---

#### Short Entry (VWAP + EMA + RSI + Cascade)
```
✅ Condition 1: Price rejects or breaks below VWAP on the 4H
   └─ Tolerance: ±0.5 Standard Deviations

✅ Condition 2: RSI is between 40-60 (not oversold, room to drop)
   └─ Neutral zone: avoids extremes

✅ Condition 3: 10 EMA < 21 EMA (Dead Cross - bearish ribbon)
   └─ Moving average alignment shows bearish momentum

✅ Condition 4: Price is below 20 EMA on 4H (cascade confirms DOWN trend)
   └─ Price must be below baseline EMA
```

**Confirmation**: ALL 4 conditions must be TRUE for valid SELL signal

**Entry Price**: At VWAP or first rejection candle close below VWAP

**Targets**:
- Target 1: VWAP - 1 SD → Take 50% profit
- Target 2: VWAP - 2 SD → Take remaining 50%

**Stop Loss**: Above VWAP + 0.5 SD OR above 20 EMA (whichever is higher)

---

### Pre-Entry Checks (Must ALL Pass)

| Check | Rule | Severity |
|-------|------|----------|
| **NY Open** | Not within first 15 min of NY 08:00 EST | Hard |
| **Position Limit** | Less than 2 open positions | Hard |
| **Risk/Trade** | Risk 0.25%-1% of account | Hard |
| **Daily Losses** | Not had 2+ consecutive losses | Hard |
| **Daily Profit** | Within daily 3% profit target | Soft |

---

### Exit Rules

| Rule | Action |
|------|--------|
| **Take Profit** | Exit at targets (50% at TP1, 50% at TP2) |
| **Stop Loss** | Exit immediately, no exceptions |
| **4-Hour No-Move** | Exit at breakeven or VWAP if no movement in 4 hours |
| **Session Close** | Close all positions 30 min before NY Close (2:30 PM EST) |

---

## 🛠️ Implementation

### File Structure

```
src/lib/
├── trading-rules.json          ← Your rule definitions (JSON)
├── rule-validator.ts           ← Evaluation engine
├── trade-validator.ts          ← Updated to use rules
└── db.ts                        ← Functions to store rule results
```

### Configuration: `trading-rules.json`

**Location**: `src/lib/trading-rules.json`

**Structure**:
```json
{
  "version": "1.0",
  "name": "4-Condition Entry System with Risk Management",
  "effective_date": "2026-05-22",
  "entry_signals": {
    "long_entry": { /* conditions */ },
    "short_entry": { /* conditions */ }
  },
  "pre_entry_checks": [ /* checks */ ],
  "exit_rules": { /* exits */ }
}
```

**To update rules**:
1. Edit `src/lib/trading-rules.json`
2. Deploy (npm run build → git push → Vercel auto-deploys)
3. All new trades evaluated against updated rules
4. Historical trades still show original rule version

---

## 🔍 Rule Evaluation Process

### Step 1: Evaluate 4 Entry Conditions

For each condition, the system checks:
- ✅ Condition passes: reason logged
- ❌ Condition fails: rejection reason recorded
- ⚠️ Data missing: noted in report

**Example Output**:
```
✅ Price at VWAP: Price 1.16350 within ±0.00050 of VWAP 1.16300
✅ RSI Filter: RSI 52.5 within 40-60 band
✅ EMA Golden Cross: EMA10 1.16324 > EMA21 1.16210
❌ Price Cascade: Price 1.16350 <= 20EMA 1.16360 (FAILED)

Result: 3/4 conditions passed → REJECT
```

### Step 2: Check Pre-Entry Requirements

Each pre-entry check must pass (or fail gracefully):
- ✅ Position count < 2
- ✅ Risk per trade 0.25%-1%
- ❌ Daily losses ≥ 2 → STOP TRADING
- ⚠️ Daily profit > 3% → SUGGESTED STOP

### Step 3: Verify Risk/Reward Ratio

```
RR Ratio = Reward Distance / Risk Distance
Required: ≥ 2.0 (minimum 1:2)

Example:
Entry: 1.16350
Stop: 1.16170 (18 pips risk)
Target: 1.16510 (16 pips reward)
RR: 16/18 = 0.89:1 ❌ (below 2:1 minimum)
```

### Step 4: Final Decision

```
✅ ACCEPT if:
   - All 4 conditions passed
   - All pre-entry checks passed
   - RR ratio ≥ 2:1

❌ REJECT if ANY fail:
   - Fewer than 4 conditions passed
   - Pre-entry check failed
   - RR ratio < 2:1
```

---

## 💻 Using the Rules Engine

### In Code

**Basic evaluation**:
```typescript
import { evaluateTradeAgainstRules } from '@/lib/rule-validator';

const result = await evaluateTradeAgainstRules('long', {
  symbol: 'EURUSD',
  entry_price: 1.16350,
  stop_price: 1.16170,
  retap_level: 1.16500,
  price: 1.16350,
  vwap: 1.16300,
  ema10: 1.16324,
  ema21: 1.16210,
  ema20: 1.16210,
  rsi: 52.5,
  atr: 0.0025,
  open_positions: 0,
  // ... other context
});

if (result.recommendation === 'ACCEPT') {
  // Execute trade
}
```

**With checklist + rules**:
```typescript
import { validateTradeWithRules } from '@/lib/trade-validator';

const combined = await validateTradeWithRules(tradeContext);
console.log(combined.rule_evaluation); // RuleEvaluation
console.log(combined.combined_recommendation); // APPROVE or REJECT
```

**Format for display**:
```typescript
import { formatRuleEvaluation } from '@/lib/rule-validator';

const report = formatRuleEvaluation(evaluation);
console.log(report);
// Output: Pretty-printed evaluation report
```

### In Database

**Store rule evaluation on trade**:
```typescript
import { dbOps } from '@/lib/db';

dbOps.storeRuleEvaluation(tradeId, ruleEvaluation);
```

**Retrieve rule evaluation**:
```typescript
const stored = dbOps.getRuleEvaluation(tradeId);
console.log(stored.rule_version); // "1.0"
console.log(stored.rule_conditions_met); // JSON array
console.log(stored.pre_entry_checks); // JSON object
```

---

## 📊 Trade Records

### Database Columns Added

| Column | Type | Purpose |
|--------|------|---------|
| `rule_version` | TEXT | Which rule version was active ("1.0") |
| `rule_conditions_met` | TEXT (JSON) | Array of condition results |
| `pre_entry_checks` | TEXT (JSON) | Object of pre-entry check results |

### Example Entry in Database

```sql
SELECT
  id,
  symbol,
  direction,
  rule_version,
  rule_conditions_met,
  pre_entry_checks,
  created_at
FROM trades
WHERE id = 'abc123def456';

-- Output:
-- id: abc123def456
-- symbol: EURUSD
-- direction: long
-- rule_version: 1.0
-- rule_conditions_met: [
--   {"id": "price_vwap", "passed": true, "reason": "Price 1.16350 within ±0.00050 of VWAP 1.16300"},
--   {"id": "rsi_band", "passed": true, "reason": "RSI 52.5 within 40-60 band"},
--   {"id": "ema_cross", "passed": true, "reason": "EMA10 1.16324 > EMA21 1.16210"},
--   {"id": "cascade", "passed": false, "reason": "Price 1.16350 <= 20EMA 1.16360"}
-- ]
-- pre_entry_checks: {
--   "ny_open": true,
--   "position_limit": true,
--   "risk_per_trade": true,
--   "daily_loss_limit": true,
--   "daily_profit_cap": true
-- }
-- created_at: 2026-05-22 14:15:00
```

---

## 🔄 Rule Versioning & Updates

### Current Version
- **Version**: 1.0
- **Name**: 4-Condition Entry System with Risk Management
- **Effective**: 2026-05-22
- **Instruments**: EURUSD, XAUUSD, BTCUSD
- **Timeframe**: 4H

### How to Update

**Option 1: Edit rules.json** (no code change)
```bash
# 1. Edit src/lib/trading-rules.json
# 2. Bump version: "version": "1.1"
# 3. Update effective_date
# 4. Deploy: npm run build && git push
```

**Option 2: Create new rule set** (advanced)
```bash
# 1. Create new file: src/lib/trading-rules-v1.1.json
# 2. Update rule-validator.ts to switch between versions
# 3. Support A/B testing (compare performance)
```

### Historical Tracking

**Each trade records**:
- Which rule version was active
- Which conditions passed/failed
- Exact rule parameters used

**Enables**:
- ✅ Performance comparison: v1.0 vs v1.1
- ✅ Compliance: prove which rules were followed
- ✅ Analytics: identify which rules trigger most
- ✅ Learning: iterate rules based on results

---

## 📈 Rule Analytics

### Questions You Can Answer

**"Which rules reject the most trades?"**
```sql
SELECT
  rule_id,
  COUNT(*) as times_triggered,
  COUNT(CASE WHEN recommendation = 'REJECT' THEN 1 END) as rejection_count
FROM (
  SELECT
    trade_id,
    json_each.value->>'id' as rule_id,
    rule_evaluation->>'recommendation' as recommendation
  FROM trades,
  json_each(rule_conditions_met)
)
GROUP BY rule_id
ORDER BY rejection_count DESC;
```

**"What's the win rate for trades that passed all 4 conditions?"**
```sql
SELECT
  COUNT(*) as total_trades,
  COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins,
  ROUND(100.0 * COUNT(CASE WHEN pnl > 0 THEN 1 END) / COUNT(*), 2) as win_rate
FROM trades
WHERE rule_conditions_met->>'all_conditions_met' = 'true'
  AND rule_version = '1.0';
```

---

## 🚀 Example: Complete Trade Flow

### Step 1: Webhook Alert Received

```json
POST /api/alerts
{
  "symbol": "EURUSD",
  "direction": "long",
  "entry_level": 1.16350,
  "stop_level": 1.16170,
  "retap_level": 1.16500,
  "ema10": 1.16324,
  "ema21": 1.16210,
  "vwap": 1.16300,
  "rsi": 52.5
}
```

### Step 2: Rules Evaluated

```
Rule Engine (v1.0):

✅ Price at VWAP: 1.16350 within ±0.5 SD of VWAP 1.16300
✅ RSI Filter: 52.5 within 40-60 band
✅ EMA Golden Cross: EMA10 1.16324 > EMA21 1.16210
✅ Price Cascade: 1.16350 > 20EMA 1.16210

Result: 4/4 conditions passed ✅
RR Ratio: 2.5:1 ✅ (≥2:1)
Pre-Entry Checks: All passed ✅

DECISION: ACCEPT ✅
```

### Step 3: Trade Queued + Rules Stored

```sql
INSERT INTO pending_trades (...);
INSERT INTO trades (...);

UPDATE trades
SET
  rule_version = '1.0',
  rule_conditions_met = '[{"id":"price_vwap","passed":true,...}]',
  pre_entry_checks = '{"ny_open":true,...}'
WHERE id = 'trade_id';
```

### Step 4: Trade Review API Shows Rules

```json
GET /api/trades/trade_id/review

{
  "rule_evaluation": {
    "rule_version": "1.0",
    "rule_name": "4-Condition Entry System",
    "conditions_evaluated": [
      {
        "id": "price_vwap",
        "name": "Price at VWAP",
        "passed": true,
        "reason": "Price 1.16350 within ±0.00050 of VWAP 1.16300"
      },
      // ... other conditions
    ],
    "conditions_passed": 4,
    "conditions_total": 4,
    "all_conditions_met": true,
    "rr_ratio": 2.5,
    "recommendation": "ACCEPT"
  },
  "trade_metrics": { /* ... */ },
  "chart": { /* Plotly */ }
}
```

---

## 🎓 Integration with Trade Review System

### Component A: Review API Shows Rules

The `/api/trades/[id]/review` endpoint now returns:

```json
{
  "rule_evaluation": {
    "rule_version": "1.0",
    "conditions_evaluated": [...],
    "rr_ratio": 2.5,
    "recommendation": "ACCEPT"
  }
}
```

### Component B: Python Scripts Know Rules

```bash
python scripts/trade_review_generator.py --csv trades.csv --rules-version 1.0
```

### Component C: Obsidian Notes Include Rules

Post-mortem markdown includes:
```markdown
## Rules Applied
- Version: 1.0
- Entry Conditions: 4/4 passed
- RR Ratio: 2.5:1
```

### Component D: Database Tracks Rules

Query rule performance by version, by condition, by outcome.

---

## 🔮 Future Enhancements

### Planned Features

1. **Rule Scheduling**
   - Different rules for different times of day
   - Different rules per instrument
   - Different rules per market regime

2. **A/B Testing**
   - Create rule v1.1
   - Run both versions in parallel
   - Compare win rates, metrics
   - Promote winner to v2.0

3. **Machine Learning**
   - Predict which rules will fail
   - Optimize rule parameters
   - Suggest rule tweaks

4. **Rule Composition**
   - Combine multiple rule sets
   - Context-aware rules
   - Conditional rule logic

---

## ✨ Summary

The **Trading Rules Engine** enables you to:

✅ Validate trades against your 4-condition system  
✅ Enforce pre-entry checks (positions, risk, daily limits)  
✅ Track rule performance over time  
✅ Update rules without code changes  
✅ A/B test rule variations  
✅ Maintain audit trails  
✅ Learn which rules matter most  

**All rules live in JSON** — change them, redeploy, and every new trade is evaluated against the updated rules!

---

**Questions?** Refer to:
- Implementation: `src/lib/rule-validator.ts`
- Configuration: `src/lib/trading-rules.json`
- Database: `src/lib/db.ts` (`storeRuleEvaluation`, `getRuleEvaluation`)
- Integration: Updated `src/lib/trade-validator.ts`
