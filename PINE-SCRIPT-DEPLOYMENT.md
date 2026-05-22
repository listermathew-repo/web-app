# Pine Script v7 Dual-Strategy Deployment Guide

## Overview

This guide walks you through deploying the dual-strategy detector to TradingView. The indicator detects:
- **Scenario 1**: Breakout/Retap on liquidity levels
- **SMC/FVG**: Smart Money Concepts (liquidity sweeps, fair value gaps, structure breaks)

---

## Step 1: Copy the Pine Script Code

**File Location**: `pine-scripts/dual-strategy-detector-v7.pine`

1. Open the file at the path above
2. Copy the entire code (Ctrl+A, Ctrl+C)

---

## Step 2: Create Indicator in TradingView

1. **Open TradingView Desktop** and navigate to a chart (EURUSD Daily recommended)
2. Click **Pine Script Editor** (bottom right, or Ctrl+Shift+S)
3. Click **New** → **New Script**
4. **Delete the default template code**
5. **Paste the dual-strategy-detector code** (Ctrl+V)
6. Click **Save** (Ctrl+S)
   - Name it: `Dual Strategy Detector v7`
   - Save to your library

---

## Step 3: Add Indicator to Chart

1. Click **Add to Chart** button in the Pine Editor
2. The indicator will appear on your chart with:
   - Blue lines showing Scenario 1 support/resistance zones
   - Purple/Red background highlighting SMC signals
   - Labels showing "S1 LONG", "S1 SHORT", "SMC LONG", "SMC SHORT"

---

## Step 4: Configure Webhook Alerts

### For Each Strategy (Scenario 1 + SMC), Create Alert Rules:

#### Alert 1: Scenario 1 Long Entry
1. Right-click chart → **Create Alert**
2. **Condition**: Select "Dual Strategy Detector v7"
3. **From**: `s1_alert_long` (crosses above 0, or True)
4. **Webhook URL**: `https://your-domain.vercel.app/api/alerts`
5. **Headers**: 
   ```
   X-API-Key: e3acbaedddbf49184b9a3c34e3d1c99b
   Content-Type: application/json
   ```
6. **Body** (JSON):
   ```json
   {
     "symbol": "EURUSD",
     "direction": "long",
     "entry_level": {{close}},
     "stop_level": 1.1617,
     "risk_amount": 400,
     "scenario": "scenario_1"
   }
   ```
7. Click **Create**

#### Alert 2: Scenario 1 Short Entry
1. **Condition**: `s1_alert_short` (crosses above 0, or True)
2. Same webhook URL + headers
3. **Body**:
   ```json
   {
     "symbol": "EURUSD",
     "direction": "short",
     "entry_level": {{close}},
     "stop_level": 1.1650,
     "risk_amount": 400,
     "scenario": "scenario_1"
   }
   ```

#### Alert 3: SMC/FVG Long Entry
1. **Condition**: `smc_alert_long` (crosses above 0, or True)
2. Same webhook URL + headers
3. **Body**:
   ```json
   {
     "symbol": "EURUSD",
     "direction": "long",
     "entry_level": {{close}},
     "stop_level": {{close}} - 0.0015,
     "risk_amount": 400,
     "scenario": "smcfvg"
   }
   ```

#### Alert 4: SMC/FVG Short Entry
1. **Condition**: `smc_alert_short` (crosses above 0, or True)
2. Same webhook URL + headers
3. **Body**:
   ```json
   {
     "symbol": "EURUSD",
     "direction": "short",
     "entry_level": {{close}},
     "stop_level": {{close}} + 0.0015,
     "risk_amount": 400,
     "scenario": "smcfvg"
   }
   ```

---

## Step 5: Test the Alerts

### Manual Testing (Without Real Market Conditions):

1. **Open Alert Settings** (View → Alerts, or bell icon)
2. **Verify all 4 alerts are active** (green checkmarks)
3. **Force-trigger an alert** (in Pine Editor, comment out a condition or adjust input to force signal)
4. **Check webhook logs**:
   - Terminal/Console should show incoming POST requests to `/api/alerts`
   - Check database: Pending trades should appear in `/api/pending`

### Live Market Testing:

1. **Switch chart to 15-minute timeframe** (faster signals for testing)
2. **Watch for indicator labels** ("S1 LONG", "SMC SHORT", etc.)
3. **Monitor your phone for ntfy notifications** (should receive alert within 5 seconds of signal)
4. **Check approval queue**:
   ```bash
   curl http://localhost:3000/api/pending \
     -H "X-API-Key: e3acbaedddbf49184b9a3c34e3d1c99b"
   ```
   Should see pending trades listed

---

## Step 6: Approve & Execute Trades

Once alerts fire:

1. **Receive ntfy notification** on phone (if ntfy.sh channel is enabled)
2. **Navigate to dashboard** (http://localhost:3000/dashboard)
3. **View pending trades** in the "Pending Approval" section
4. **Click Approve** button
5. **Trade executes** on Capital.com via API
6. **Confirmation notification** sent to ntfy

---

## Troubleshooting

### Alerts Not Firing
- ✅ Verify webhook URL is correct (no typos)
- ✅ Check API key matches `process.env.WEBHOOK_API_KEY` in `.env.local`
- ✅ Confirm indicator added to chart (should see labels & colors)
- ✅ Try forcing signal by adjusting input values

### Webhook Returns 401/403
- ✅ Double-check X-API-Key header value
- ✅ Verify header name is exactly `X-API-Key` (case-sensitive)
- ✅ Confirm `.env.local` has `WEBHOOK_API_KEY` set

### Trades Not Appearing in Queue
- ✅ Check dev server logs: `npm run dev` should show incoming requests
- ✅ Verify database connection: Check `/api/health` endpoint
- ✅ Review trade validation: Check console output for rejection reasons

### Webhook Returns 429 (Duplicate)
- ✅ Same symbol + direction fired twice within 30 seconds (intentional protection)
- ✅ Wait 30+ seconds before sending another alert for same pair

---

## Indicator Settings Reference

### Scenario 1 Settings
| Parameter | Default | Purpose |
|-----------|---------|---------|
| Lookback | 50 | Number of bars to find swing high/low |
| Breakout Distance | 5 pips | How far above/below swing to trigger breakout |
| Retap Zone | 10 pips | Zone around swing level for retap entries |

### SMC/FVG Settings
| Parameter | Default | Purpose |
|-----------|---------|---------|
| Min FVG Gap | 5 pips | Minimum gap size to qualify as FVG |
| FVG Fill Lookback | 5 bars | How many bars back to check if gap was filled |
| Liquidity Sweep Vol | 0.8 | Volume multiplier threshold for sweep confirmation |

### CHoCH Settings
| Parameter | Default | Purpose |
|-----------|---------|---------|
| Min Swings | 3 | Minimum swings in structure before CHoCH valid |

---

## Next Steps After Deployment

1. **Run E2E Test**: `npx ts-node scripts/e2e-workflow-test.ts`
   - Verifies health, alerts, queue, approval, export endpoints
   
2. **Monitor Dashboard**: 
   - View strategy filter: Compare Scenario 1 vs SMC/FVG performance
   - Watch pending trades queue for new alerts
   - Export backtest data to analyze RR ratios

3. **Live Trading**:
   - Start with SMC/FVG on 4H/Daily timeframes (fewer false signals)
   - Track win rate and average RR achieved
   - Adjust indicator settings based on performance

4. **Documentation Review**:
   - Read `docs/STRATEGY-SMC-GUIDE.md` for SMC methodology details
   - Read `docs/BACKTEST-RR-GUIDE.md` for trade analysis framework

---

## Support

If indicators don't fire:
1. Check Pine Editor console for errors (View → Console)
2. Verify webhook URL format (no extra spaces/characters)
3. Test endpoint manually: `curl http://localhost:3000/api/alerts`
4. Review indicator inputs (may need adjustment for your timeframe)

---

**Deployment Checklist**
- [ ] Pine Script code copied to TradingView
- [ ] Indicator added to chart (shows labels & colors)
- [ ] 4 webhook alerts created (S1 Long/Short, SMC Long/Short)
- [ ] API key verified in headers
- [ ] Test alert fired and received on phone
- [ ] Pending queue visible in dashboard
- [ ] Ready for live trading

**Expected Timeline**: 15-20 minutes for full setup

---

**Last Updated**: 2026-05-22  
**Pine Script Version**: v7  
**Status**: Ready for deployment
