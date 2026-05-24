# Trading System Architecture - Comprehensive Audit

**Date**: 2026-05-22  
**Status**: REVIEWING COMPLETENESS  
**Last Updated**: After detailed code inspection

---

## 🔴 CRITICAL ISSUES FOUND

### **ISSUE 1: Rules Engine NOT Integrated into Webhook Flow** 🚨

**Location**: `src/app/api/alerts/route.ts` line 158

**Problem**:
```typescript
// ❌ CURRENT - Using old validation only
const validationResult = await validateTrade(tradeContext);
```

**Should Be**:
```typescript
// ✅ SHOULD BE - Using combined validation with rules
const validationResult = await validateTradeWithRules(tradeContext);
```

**Impact**: 
- The configurable rules engine you just built is **NOT being used**
- All trades go through the old 10-point checklist only
- 4-condition entry rules are never evaluated
- Risk/reward ratio checks from rules engine are skipped
- Pre-entry checks from rules (NY open, position limit, risk %, daily losses) are not enforced

**Fix Required**: Change one line in /api/alerts/route.ts line 158

---

### **ISSUE 2: Rule Evaluation Context Incomplete** 

**Location**: `src/lib/trade-validator.ts` lines 423-441

**Problem**:
```typescript
const ruleResult = await evaluateTradeAgainstRules(context.direction, {
  // ... other fields ...
  rsi: undefined,                    // ❌ Missing RSI from Pine Script
  open_positions: 0,                 // ❌ Hardcoded, should query DB
  account_size: 10000,               // ❌ Hardcoded example value
  risk_amount: 100,                  // ❌ Hardcoded, should calculate
  daily_losses_count: 0,             // ❌ Hardcoded, should query DB
  daily_profit: 0,                   // ❌ Hardcoded, should query DB
  minutes_since_ny_open: 0,          // ❌ Hardcoded, should calculate
});
```

**Impact**:
- Pre-entry checks can't pass properly (all checks fail due to missing data)
- NY open check always fails (minutes_since_ny_open = 0)
- Position limit check always passes (hardcoded 0)
- Daily loss limit always passes (hardcoded 0)
- Risk per trade check always fails (hardcoded wrong value)

**Fix Required**: Populate these fields from actual sources:
- `rsi` from Pine Script webhook data
- `open_positions` from `dbOps.getOpenPositions().length`
- `account_size` from Capital.com API or config
- `risk_amount` from trade context calculation
- `daily_losses_count` from `dbOps.getTradeHistory()` filtered by date
- `daily_profit` from `dbOps.getTradeHistory()` filtered by date and summed P&L
- `minutes_since_ny_open` from current time vs 08:00 EST

---

### **ISSUE 3: Rule Evaluation Not Stored in Database**

**Location**: `src/app/api/alerts/route.ts` (missing after line 196)

**Problem**: When trade is queued, the rule evaluation result is never stored

**Current Code**:
```typescript
// After validation passes, queue trade:
dbOps.insertPendingTrade({
  id: tradeId,
  symbol: alert.symbol,
  direction: alert.direction,
  entry_level: alert.entry_level,
  // ... other fields ...
  // ❌ NOT STORING: rule_evaluation, rule_conditions_met, pre_entry_checks
});
```

**Should Store**:
```typescript
// After queuing trade, store rule evaluation
if (validationResult.rule_evaluation) {
  dbOps.storeRuleEvaluation(tradeId, validationResult.rule_evaluation);
}
```

**Impact**:
- No audit trail of which rules were active
- No A/B testing capability (can't compare v1.0 vs v1.1)
- No way to know why trade was accepted/rejected
- /api/trades/[id]/review can't show rule evaluation

**Fix Required**: Add 3-4 lines to store rule evaluation after queueing trade

---

## ⚠️ MAJOR GAPS

### **GAP 1: Missing RSI Data in Webhook**

**Problem**: The webhook schema accepts RSI but /api/alerts doesn't require it

**Current Code** (`src/app/api/alerts/route.ts` line 18):
```typescript
// ❌ RSI is optional
atr: z.number().positive().optional(),
```

**Should Be** (for rules to work):
```typescript
// ✅ RSI should be required if rules engine is enabled
rsi: z.number().min(0).max(100),
```

**Or in TradingView webhook, add to Pine Script**:
```pinescript
request.post(url=webhookUrl, headers={"X-API-Key": apiKey}, data={
  // ... existing fields ...
  "rsi": ta.rsi(close, 14)  // Add RSI calculation
})
```

**Impact**: Rules engine can't enforce "RSI between 40-60" check without data

---

### **GAP 2: No Capital.com Integration Verification**

**Problem**: Capital.com client exists but is never tested

**Files Created**:
- ✅ `src/lib/capital-client.ts` - Client exists
- ✅ `src/app/api/pending/[id]/approve/route.ts` - Calls `getCapitalClient()`
- ❌ No test of Capital.com authentication
- ❌ No test of order execution
- ❌ No test of position tracking

**Risk**: First time trying to execute a trade could fail silently

---

### **GAP 3: Branch Protection Not Enabled**

**Checked**: `gh api repos/listermathew-repo/web-app/branches/main/protection`

**Result**: `HTTP 404 - Branch not protected`

**Problem**: Can commit directly to main without CI passing

**Should Have**:
- ✅ Require status checks to pass (ci-web-app workflow)
- ✅ Require pull request reviews
- ✅ Dismiss stale PR approvals
- ✅ Restrict who can push to main

---

### **GAP 4: Limited Test Coverage**

**Tests Found**:
- ✅ `src/__tests__/api/alerts.test.ts` - Basic webhook tests
- ✅ `src/__tests__/api/pending.test.ts` - Approval queue tests
- ❌ No tests for rule-validator.ts (the new engine)
- ❌ No tests for rules evaluation logic
- ❌ No tests for pre-entry checks
- ❌ No tests for risk/reward ratio calculation
- ❌ No integration tests (end-to-end webhook→approval→execution)

---

### **GAP 5: Position Tracking Uses Mock Data**

**Location**: `src/app/api/positions/route.ts` line 20

**Problem**:
```typescript
current_price: pos.entry_price,  // ❌ Always same as entry (no actual current price)
pnl: calculatePnL(pos.direction, pos.entry_price, pos.entry_price, pos.size || 1),  // ❌ Always 0
```

**Impact**: Positions show 0 P&L even when profitable

**Should Fetch**: Live prices from Capital.com or TradingView WebSocket

---

## ✅ WHAT'S ACTUALLY IMPLEMENTED

### Database & Schema
- ✅ SQLite database with better-sqlite3
- ✅ trades table with all fields
- ✅ pending_trades table for approval queue
- ✅ validation_log table for Check #9 results
- ✅ Migration system (V1→V2)
- ✅ Rule tracking columns (rule_version, rule_conditions_met, pre_entry_checks)
- ✅ Database functions: insertTrade, getPendingTrades, updateTradeStatus, etc.

### Webhook Authentication
- ✅ X-API-Key validation in /api/alerts
- ✅ Environment variable WEBHOOK_API_KEY
- ✅ 401 Unauthorized on invalid key

### Manual Approval Queue
- ✅ GET /api/pending - Lists pending trades
- ✅ POST /api/pending/[id]/approve - Approves and executes
- ✅ POST /api/pending/[id]/reject - Rejects trade
- ✅ 5-minute expiry + auto-cleanup
- ✅ Duplicate detection (30-second window)

### Trade History & Logging
- ✅ Trade history logged to database
- ✅ Validation results logged
- ✅ Alert logging
- ✅ Health checks logged
- ✅ System health table

### Error Alerting
- ✅ `src/lib/alerts.ts` - ntfy.sh integration
- ✅ `src/lib/alerts-redundancy.ts` - Multi-channel alerts
- ✅ Sends to ntfy.sh/mgm-7k4x-live on errors
- ✅ Priority levels (3=normal, 4=warning, 5=urgent)

### Position Tracking
- ✅ /api/positions endpoint
- ✅ Returns open trades from database
- ✅ Calculates P&L (but with mock price data)
- ✅ Shows position metadata

### Health Monitoring
- ✅ /api/health endpoint
- ✅ Tests database connectivity
- ✅ Tests ntfy.sh connectivity
- ✅ Tests Capital.com API (if configured)
- ✅ Returns component status

### Trade Review & Visualization
- ✅ /api/trades/[id]/review endpoint
- ✅ Returns Plotly JSON chart
- ✅ Shows validation results
- ✅ Shows rule evaluation structure

### Configurable Rules Engine
- ✅ `src/lib/trading-rules.json` - v1.0 rule config
- ✅ `src/lib/rule-validator.ts` - Evaluation engine
- ✅ 4-condition entry system (VWAP, RSI, EMA, Cascade)
- ✅ Pre-entry checks (NY open, position limit, risk/trade, daily losses, daily profit)
- ✅ Risk/reward ratio validation
- ✅ Rule versioning support
- ✅ Audit trail structure

### Testing Suite
- ✅ Vitest configured
- ✅ Basic API tests (alerts, pending)
- ✅ Test script: scripts/test-rules-engine.ps1
- ✅ Performance queries: scripts/rule-performance-queries.sql
- ✅ Testing guide: TESTING_RULES_ENGINE.md

### CI/CD
- ✅ GitHub Actions workflow (ci-web-app.yml)
- ✅ Runs npm test and npm run build
- ❌ Branch protection NOT configured
- ❌ CI doesn't block bad merges

---

## 📋 SUMMARY TABLE

| Component | Exists? | Functional? | Integrated? | Issues |
|-----------|---------|------------|-------------|--------|
| **Webhook Authentication** | ✅ | ✅ | ✅ | None |
| **Approval Queue** | ✅ | ✅ | ✅ | None |
| **Trade Logging** | ✅ | ✅ | ✅ | None |
| **Error Alerting** | ✅ | ✅ | ✅ | None |
| **Position Tracking** | ✅ | ⚠️ | ✅ | Mock price data |
| **Health Monitoring** | ✅ | ✅ | ✅ | None |
| **Rules Engine Code** | ✅ | ✅ | ❌ | **NOT CALLED IN WEBHOOK** |
| **Rules Evaluation Data** | ✅ | ⚠️ | ❌ | Hardcoded values |
| **Rule Storage** | ✅ | ⚠️ | ❌ | Never saved to DB |
| **Capital.com Integration** | ✅ | ⚠️ | ⚠️ | Untested |
| **Test Coverage** | ⚠️ | ✅ | ❌ | Missing rule tests |
| **Branch Protection** | ❌ | N/A | N/A | **NOT CONFIGURED** |

---

## 🎯 PRIORITY ACTION ITEMS

### **P0 - Critical (Must Fix Before Live Trading)**

1. **[CRITICAL] Wire Rules Engine into Webhook**
   - File: `src/app/api/alerts/route.ts`
   - Change: Line 158 from `validateTrade` to `validateTradeWithRules`
   - Time: 2 minutes
   - Impact: Rules never evaluated without this

2. **[CRITICAL] Populate Rule Evaluation Context**
   - File: `src/lib/trade-validator.ts` lines 423-441
   - Add: Query DB for real values (positions, daily P&L, daily losses)
   - Add: Calculate minutes_since_ny_open
   - Time: 30 minutes
   - Impact: Pre-entry checks fail without real data

3. **[CRITICAL] Store Rule Evaluation on Trade**
   - File: `src/app/api/alerts/route.ts` after line 207
   - Add: `dbOps.storeRuleEvaluation(tradeId, ruleEvaluation)`
   - Time: 5 minutes
   - Impact: No audit trail without this

4. **[CRITICAL] Add RSI to Webhook Payload**
   - File: TradingView Pine Script
   - Add: `"rsi": ta.rsi(close, 14)` to webhook body
   - OR: Make RSI required in Zod schema
   - Time: 5 minutes (Pine Script) or 2 minutes (schema)
   - Impact: RSI check always fails without data

### **P1 - High (Before Full Deployment)**

5. **Configure Branch Protection**
   - Tool: GitHub Settings → Branches
   - Enable: Require CI status checks, require reviews
   - Time: 5 minutes
   - Impact: Prevents breaking code from reaching production

6. **Test Capital.com Integration**
   - Add: Integration test for order execution
   - Test: Authentication, order placement, position retrieval
   - Time: 1-2 hours
   - Impact: First live trade shouldn't be the discovery test

7. **Add Rule Engine Tests**
   - Add: Tests for rule-validator.ts functions
   - Test: All 4 conditions, pre-entry checks, RR ratio
   - Time: 1-2 hours
   - Impact: 7 test cases already defined in test script

8. **Fetch Live Prices for Positions**
   - Update: /api/positions endpoint
   - Fetch from: Capital.com API or TradingView ticker
   - Time: 1-2 hours
   - Impact: Position P&L currently always shows 0

### **P2 - Medium (Polish & Monitoring)**

9. **Add Missing RSI to Schema**
   - Make RSI required in validation schema
   - Time: 2 minutes

10. **Add E2E Integration Tests**
    - Test: Full webhook→validation→approval→execution flow
    - Time: 2-3 hours

11. **Implement Rule Performance Dashboard**
    - Create: Page showing rule statistics
    - Query: Run the 10 analytics queries
    - Time: 3-4 hours

---

## ❓ CRITICAL QUESTIONS FOR USER

1. **RSI Data Source**: Does your TradingView Pine Script currently send RSI in the webhook? If not, where should it come from?

2. **Capital.com Credentials**: Is the Capital.com API key set in environment variables (.env.local)? Has it been tested?

3. **Account Size**: Where should account_size come from - hardcoded config, Capital.com API, or database?

4. **Daily Reset**: What time should daily_losses_count and daily_profit reset (midnight? trading hours end? specific timezone)?

5. **Live Prices**: Should live prices for P&L calculation come from:
   - Capital.com API /open-positions endpoint?
   - TradingView WebSocket feed?
   - Last trade price stored in DB?

6. **Risk Amount Calculation**: How is risk_amount calculated? Formula: (Stop Loss - Entry) * Lot Size * Pip Value?

7. **NY Open Time**: Should "NY Open" check be fixed at 08:00 EST or should it be configurable per instrument?

---

## 📊 CODE HEALTH METRICS

- **Total Lines of Code**: ~15,000+
- **Test Coverage**: ~15% (missing rule engine tests)
- **Database Migrations**: 4 migrations, all integrated
- **API Endpoints**: 12 endpoints, most functional
- **Configuration Externalized**: ✅ trading-rules.json, env vars
- **Error Handling**: ✅ Comprehensive ntfy.sh alerts
- **Documentation**: ✅ 2 comprehensive guides (TRADING_RULES_ENGINE.md, TESTING_RULES_ENGINE.md)

---

## 🔧 NEXT STEPS (Recommended Order)

1. **Immediately** (5 min): Fix line 158 in /api/alerts/route.ts
2. **Next** (30 min): Populate real data in validateTradeWithRules
3. **Next** (5 min): Add storeRuleEvaluation call after queueing
4. **Next** (2 min): Make RSI required in webhook schema
5. **Today** (1 hour): Configure branch protection
6. **Today** (2-3 hours): Add rule engine unit tests
7. **Today** (1-2 hours): Test Capital.com integration
8. **Before Live** (2-3 hours): Implement E2E tests
9. **Before Live** (2 hours): Add live price fetching to positions

---

**This audit reveals that you have ~85% of the system built, but the new rules engine isn't wired in. The fixes are straightforward—mostly just connecting existing pieces that were built but not integrated.**
