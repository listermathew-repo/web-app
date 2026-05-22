# Trading Rules Engine - Testing & Verification Guide

## 📋 Overview

This guide walks through testing the configurable 4-condition entry rules system after deployment. The rules engine has been fully implemented and integrated into the trade validation pipeline.

**Current Status:**
- ✅ Code committed to GitHub
- ✅ Build passes TypeScript checks
- ⏳ Deployed to Vercel (auto-deploy on push)
- ⏳ Ready for testing with live webhook alerts

---

## 🎯 Testing Phases

### Phase 1: Local Development Testing (Before Deployment)

#### Step 1.1: Start Development Server
```bash
cd C:\Users\mathe\web-app
npm run dev
# Server runs at http://localhost:3000
```

#### Step 1.2: Set API Key for Webhook Authentication
```powershell
# In PowerShell, set the environment variable
$env:WEBHOOK_API_KEY = 'your-32-char-api-key-from-.env.local'

# Verify it's set
Write-Host $env:WEBHOOK_API_KEY
```

#### Step 1.3: Run Test Script (7 test scenarios)
```powershell
# Execute all 7 test cases
./scripts/test-rules-engine.ps1

# Expected output:
# ✅ TEST 1: Perfect entry (all 4 conditions pass) → ACCEPT
# ✅ TEST 2: Price not at VWAP → REJECT
# ✅ TEST 3: RSI overbought → REJECT
# ✅ TEST 4: Bearish EMA (Golden Cross fails) → REJECT
# ✅ TEST 5: Price below 20 EMA (Cascade fails) → REJECT
# ✅ TEST 6: RR ratio < 2:1 → REJECT
# ✅ TEST 7: Too close to NY open → REJECT
```

#### Step 1.4: Verify Database Storage
```bash
# Check that trades were stored with rule evaluation
sqlite3 .db/trading.db "SELECT id, symbol, status, rule_version, rule_conditions_met FROM pending_trades LIMIT 1;"

# Should show:
# - rule_version: "1.0"
# - rule_conditions_met: JSON array with condition evaluations
```

#### Step 1.5: Test Approval Workflow
```bash
# 1. Get trade ID from pending trades
TRADE_ID=$(sqlite3 .db/trading.db "SELECT id FROM pending_trades WHERE status='pending' LIMIT 1;")

# 2. Approve the trade
curl -X POST http://localhost:3000/api/pending/$TRADE_ID/approve

# 3. Verify it moved to trades table with rule evaluation stored
sqlite3 .db/trading.db "SELECT rule_version, rule_conditions_met FROM trades WHERE id='$TRADE_ID';"
```

#### Step 1.6: View Rule Evaluation in Review API
```bash
TRADE_ID="<trade_id_from_above>"

# Fetch trade review with rule evaluation
curl http://localhost:3000/api/trades/$TRADE_ID/review | jq '.rule_evaluation'

# Expected output includes:
# {
#   "rule_version": "1.0",
#   "conditions_evaluated": [
#     {"id": "price_vwap", "name": "Price at VWAP", "passed": true, "reason": "..."},
#     {"id": "rsi_band", "name": "RSI Filter", "passed": true, "reason": "..."},
#     {"id": "ema_cross", "name": "EMA Golden Cross", "passed": true, "reason": "..."},
#     {"id": "cascade", "name": "Price Cascade", "passed": true, "reason": "..."}
#   ],
#   "conditions_passed": 4,
#   "conditions_total": 4,
#   "all_conditions_met": true,
#   "pre_entry_checks": {...},
#   "rr_ratio": 2.5,
#   "recommendation": "ACCEPT"
# }
```

---

### Phase 2: Live Deployment Testing (After Vercel Deploy)

#### Step 2.1: Verify Vercel Deployment
```bash
# Check deployment status
# GitHub → Actions → Latest workflow run should show "passed"

# Vercel should automatically deploy when you pushed to main
# Check: https://vercel.com/listermathew-repo/web-app
```

#### Step 2.2: Test Webhook Endpoint (Live URL)
```bash
# Get your Vercel deployment URL from dashboard
VERCEL_URL="https://your-app.vercel.app"

# Test with authentication
curl -X POST $VERCEL_URL/api/alerts \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "EURUSD",
    "direction": "long",
    "entry_level": 1.16350,
    "stop_level": 1.16170,
    "retap_level": 1.16710,
    "price": 1.16350,
    "vwap": 1.16300,
    "ema10": 1.16324,
    "ema21": 1.16210,
    "ema20": 1.16210,
    "rsi": 52.5,
    "atr": 0.0050,
    "open_positions": 0,
    "account_size": 10000,
    "risk_amount": 50
  }'

# Expected response: 202 Accepted
```

#### Step 2.3: Trigger Real TradingView Alert
1. Open TradingView chart (EURUSD 4H)
2. Set up alert that fires webhook to:
   ```
   https://your-app.vercel.app/api/alerts?key=your-api-key
   ```
3. Trigger alert manually (or wait for signal)
4. Check pending trades queue
5. Review rule evaluation
6. Approve and verify execution

---

## 🧪 Test Case Details

### Test Case 1: Perfect Entry (Expected: ACCEPT)

**Scenario**: All 4 conditions pass, RR ratio sufficient

**Market Data**:
```json
{
  "symbol": "EURUSD",
  "price": 1.16350,
  "vwap": 1.16300,
  "ema10": 1.16324,
  "ema21": 1.16210,
  "ema20": 1.16210,
  "rsi": 52.5,
  "entry": 1.16350,
  "stop": 1.16170,
  "target": 1.16710
}
```

**Evaluation**:
```
✅ Price at VWAP: 1.16350 within ±25 pips of VWAP 1.16300
✅ RSI Filter: 52.5 within 40-60 band
✅ EMA Golden Cross: EMA10 1.16324 > EMA21 1.16210
✅ Price Cascade: 1.16350 > 20EMA 1.16210
✅ RR Ratio: (1.16710-1.16350)/(1.16350-1.16170) = 360/180 = 2.0:1

Result: 4/4 conditions passed, RR sufficient → ACCEPT ✅
```

**Verification**:
- Trade queued to pending_trades
- Status: pending
- rule_version: "1.0"
- rule_conditions_met: all conditions = true

---

### Test Case 2: Price Not at VWAP (Expected: REJECT)

**Failure Point**:
```
Price: 1.16500 (200 pips from VWAP)
VWAP: 1.16300
Tolerance: ±25 pips (0.5 * ATR = 0.5 * 50)
Diff: 200 > 25 → FAILED
```

**Evaluation**:
```
❌ Price at VWAP: 1.16500 is 200 pips away from VWAP 1.16300 (outside tolerance)
✅ RSI Filter: 52.5 within 40-60 band
✅ EMA Golden Cross: EMA10 1.16324 > EMA21 1.16210
✅ Price Cascade: 1.16500 > 20EMA 1.16210

Result: 3/4 conditions passed → REJECT ❌
```

---

### Test Case 3: RSI Overbought (Expected: REJECT)

**Failure Point**:
```
RSI: 75.0
Band: 40-60 (neutral zone)
Status: Overbought (no room to run higher)
```

**Evaluation**:
```
✅ Price at VWAP: 1.16350 within tolerance
❌ RSI Filter: 75.0 is outside 40-60 band (overbought)
✅ EMA Golden Cross: EMA10 1.16324 > EMA21 1.16210
✅ Price Cascade: 1.16350 > 20EMA 1.16210

Result: 3/4 conditions passed → REJECT ❌
```

---

### Test Case 4: Bearish EMA (Expected: REJECT)

**Failure Point**:
```
EMA10: 1.16200
EMA21: 1.16210
Direction: EMA10 < EMA21 (Dead Cross - bearish)
For long: Need EMA10 > EMA21 (Golden Cross - bullish)
```

**Evaluation**:
```
✅ Price at VWAP: 1.16350 within tolerance
✅ RSI Filter: 52.5 within 40-60 band
❌ EMA Golden Cross: EMA10 1.16200 <= EMA21 1.16210 (bearish, not bullish)
✅ Price Cascade: 1.16350 > 20EMA 1.16210

Result: 3/4 conditions passed → REJECT ❌
```

---

### Test Case 5: Price Below 20 EMA (Expected: REJECT)

**Failure Point**:
```
Price: 1.16200
20 EMA: 1.16250
Status: Price < 20EMA (below baseline, no uptrend confirmation)
```

**Evaluation**:
```
✅ Price at VWAP: 1.16350 within tolerance
✅ RSI Filter: 52.5 within 40-60 band
✅ EMA Golden Cross: EMA10 1.16324 > EMA21 1.16210
❌ Price Cascade: 1.16200 <= 20EMA 1.16250 (price below baseline)

Result: 3/4 conditions passed → REJECT ❌
```

---

### Test Case 6: RR Ratio Insufficient (Expected: REJECT)

**Failure Point**:
```
Entry: 1.16350
Stop: 1.16320 (30 pips risk)
Target: 1.16380 (30 pips reward)
RR Ratio: 30/30 = 1.0:1
Minimum Required: 2.0:1
```

**Evaluation**:
```
✅ Price at VWAP: condition passes
✅ RSI Filter: condition passes
✅ EMA Golden Cross: condition passes
✅ Price Cascade: condition passes
❌ RR Ratio: 1.0:1 < 2.0:1 (insufficient reward for risk)

Result: 4/4 conditions passed BUT RR insufficient → REJECT ❌
```

---

### Test Case 7: Too Close to NY Open (Expected: REJECT)

**Failure Point**:
```
NY Open (EST): 08:00
Current Time: 08:05 (5 minutes after)
Minimum Buffer: 15 minutes
Volatility: High during first 15 min, avoid
```

**Evaluation**:
```
✅ All 4 entry conditions pass
✅ RR ratio sufficient
❌ NY Open Check: 5 minutes since NY open < 15 minute minimum
❌ Pre-entry Check Failed: Avoid high volatility period

Result: 4/4 conditions + RR ratio OK BUT pre-entry check fails → REJECT ❌
```

---

## 📊 Rule Performance Monitoring

### Query 1: Which Conditions Reject Most Trades?

```sql
-- Find if one condition is too strict
SELECT
  json_extract(value, '$.id') as condition,
  COUNT(*) as checked,
  COUNT(CASE WHEN json_extract(value, '$.passed') = 0 THEN 1 END) as failed,
  ROUND(100.0 * COUNT(CASE WHEN json_extract(value, '$.passed') = 0 THEN 1 END) / COUNT(*), 2) as fail_rate_pct
FROM trades, json_each(trades.rule_conditions_met)
GROUP BY condition
ORDER BY fail_rate_pct DESC;

-- Expected: price_vwap and cascade most common (they're the tightest filters)
```

### Query 2: Win Rate by Rule Version

```sql
SELECT
  rule_version,
  COUNT(*) as trades,
  COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins,
  ROUND(100.0 * COUNT(CASE WHEN pnl > 0 THEN 1 END) / COUNT(*), 2) as win_rate_pct,
  ROUND(AVG(pnl), 2) as avg_pnl
FROM trades
WHERE status IN ('exited', 'closed')
GROUP BY rule_version;

-- Expected: v1.0 win rate > 50%, avg_pnl > 0
```

### Query 3: Verify All Pre-Entry Checks

```sql
-- Check which pre-entry checks are triggering
SELECT
  pre_entry_checks,
  COUNT(*) as count
FROM trades
WHERE rule_version = '1.0'
GROUP BY pre_entry_checks;

-- Expected: Most trades pass all checks, occasionally ny_open or daily_losses block
```

---

## ✅ Verification Checklist

### Local Testing (Before Live Trading)
- [ ] npm run build passes without errors
- [ ] npm run dev starts successfully
- [ ] /api/alerts accepts POST with X-API-Key header
- [ ] All 7 test cases run without errors
- [ ] Pending trades appear in database with rule_version
- [ ] Rule evaluation stored in rule_conditions_met column
- [ ] /api/trades/[id]/review returns rule_evaluation JSON
- [ ] Pre-entry checks are evaluated correctly

### Vercel Deployment
- [ ] GitHub push triggers Vercel deployment
- [ ] Deployment completes successfully (no errors in logs)
- [ ] WEBHOOK_API_KEY environment variable set in Vercel dashboard
- [ ] /api/alerts endpoint accessible on live URL
- [ ] Health check: GET /api/health returns OK status

### Live Trading
- [ ] TradingView webhook configured with correct API key
- [ ] First alert triggers → trade appears in pending queue
- [ ] Rule evaluation shows 4 conditions with reasons
- [ ] Approval endpoint works (POST /api/pending/[id]/approve)
- [ ] Approved trade appears in /api/trades/[id]/review
- [ ] Chart and rule evaluation visible in review page
- [ ] Obsidian vault syncs markdown notes

---

## 🔧 Troubleshooting

### "Unauthorized" Error on /api/alerts

**Problem**: X-API-Key validation fails

**Solution**:
1. Verify API key in .env.local:
   ```
   WEBHOOK_API_KEY=your-32-char-key
   ```
2. Ensure TradingView webhook header includes:
   ```
   Authorization: Bearer X-API-Key:your-32-char-key
   ```
3. Or pass as query param: `?key=your-api-key`

---

### Rule Evaluation Shows "conditions_passed: 0"

**Problem**: All conditions failing unexpectedly

**Solution**:
1. Check if market data is being sent:
   ```json
   {
     "price": 1.16350,
     "vwap": 1.16300,
     "ema10": 1.16324,
     "ema21": 1.16210,
     "ema20": 1.16210,
     "rsi": 52.5,
     "atr": 0.0050
   }
   ```
2. Verify all 6 fields are present (missing data causes failures)
3. Check data types (should be numbers, not strings)

---

### Database Errors When Storing Rule Evaluation

**Problem**: "rule_conditions_met column does not exist"

**Solution**:
1. Ensure migration ran: `npm run build` triggers migrations
2. Check database schema:
   ```sql
   .schema trades
   ```
3. Should show columns: rule_version, rule_conditions_met, pre_entry_checks
4. If missing, manually run migration or delete .db/trading.db to recreate

---

## 📈 Next Steps After Testing

### If Tests Pass ✅
1. **Go Live**: Start trading with rules engine active
2. **Monitor Daily**: Check win rate, rule rejection counts
3. **Iterate**: If certain condition triggers too often, adjust in trading-rules.json v1.1
4. **Compare**: Track v1.0 vs v1.1 performance

### If Tests Fail ❌
1. **Identify Issue**: Check logs, database, webhook payload
2. **Fix Code**: Update rule-validator.ts or rule evaluation logic
3. **Retest**: Run test script again
4. **Deploy**: Push fix to GitHub → Vercel auto-deploys

---

## 📝 Documentation References

- **Rules Configuration**: `src/lib/trading-rules.json`
- **Rule Validator**: `src/lib/rule-validator.ts`
- **API Integration**: `src/lib/trade-validator.ts`
- **Database Schema**: `src/lib/db-schema-v2.ts`
- **Rules Engine Docs**: `TRADING_RULES_ENGINE.md`

---

**Status**: Ready for testing  
**Last Updated**: 2026-05-22  
**Rule Version**: 1.0  
**Instruments**: EURUSD, XAUUSD, BTCUSD  
**Timeframe**: 4H
