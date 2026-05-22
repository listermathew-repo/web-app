# RUNBOOK: First Live Trade Execution

**Purpose**: Step-by-step guide to execute the first live trade safely  
**Audience**: Manual operator approving trades  
**Pre-requisites**: All hardening items complete, system deployed to Vercel, TradingView Pine Script configured with live webhook  

---

## CRITICAL SAFETY CHECKLIST

Before executing ANY live trade:

- [ ] Verify API key is correct in `.env.local` (`WEBHOOK_API_KEY`)
- [ ] Verify Capital.com credentials are PAPER TRADING account (NOT live account)
- [ ] Verify all environment variables loaded: `ACCOUNT_SIZE`, `CAPITAL_COM_API_KEY`, `CAPITAL_COM_ACCOUNT_ID`, `NTFY_WEBHOOK_URL`
- [ ] Verify database initialized: `.db/trading.db` exists
- [ ] Verify health check passes: `GET /api/health` returns `"status": "ok"`
- [ ] Verify rate limiter works: 11 requests in succession → 429 on 11th
- [ ] Verify request context tracking: Every response includes `request_id` and `duration_ms`
- [ ] Verify ntfy.sh alerts work: `POST /api/alerts` → receive notification within 5 seconds

---

## Step 1: Verify System Health (5 minutes)

### 1.1 Check Health Endpoint
```bash
curl https://your-vercel-domain.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-22T14:30:00Z",
  "components": {
    "database": { "status": "ok" },
    "webhook": { "status": "ok" },
    "trades": { "status": "ok" },
    "capital_com": { "status": "ok" },
    "ntfy": { "status": "ok" }
  }
}
```

### 1.2 Test Rate Limiting
Send 11 rapid requests - request 11 should return 429 (Rate Limit Exceeded)

### 1.3 Verify ntfy Alerting
Send test alert, confirm notification received on phone within 5 seconds

---

## Step 2: Send Test Alert from TradingView (10 minutes)

### 2.1 Configure Pine Script
Webhook URL: `https://your-vercel-domain.vercel.app/api/alerts`  
Header: `X-API-Key: YOUR_API_KEY`

### 2.2 Trigger Alert Manually
Use Pine Script or Strategy Tester to generate alert

### 2.3 Verify Alert Received
```bash
curl https://your-vercel-domain.vercel.app/api/pending
```

Should show new pending trade with status: `pending`

---

## Step 3: Approve Trade in UI (5 minutes)

1. Open web app dashboard
2. Navigate to **Pending Trades**
3. Review trade details (symbol, direction, entry/stop levels)
4. Click **APPROVE** button

**Expected**: Trade executes on Capital.com (PAPER TRADING), ntfy notification sent

---

## Step 4: Monitor Trade (15 minutes)

1. Watch position in Capital.com account
2. Verify entry price, stop loss, take profit levels
3. Monitor ntfy alerts for:
   - Stop loss warnings
   - Stop loss triggers
   - Take profit reached
4. Check dashboard for live P&L updates

---

## Step 5: Trade Closes (Manual or Stop Loss)

- Position automatically closes at stop loss or take profit
- ntfy alert sent with final P&L
- Trade history updated with exit price and profit/loss
- Review trade journal at `/api/history`

---

## COMMON ERRORS & FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | API key mismatch | Verify `WEBHOOK_API_KEY` in Pine Script header |
| `400 Invalid symbol` | Invalid format | Use uppercase symbols: `EURUSD`, `XAUUSD`, etc. |
| `429 Rate Limit` | Too many requests | Wait 60 seconds before retrying |
| `500 Database Error` | DB corrupted | Delete `.db/trading.db` and restart |
| Trade stuck "pending" | Service error | Check `/api/health` and restart server |
| No ntfy alerts | Config error | Verify `NTFY_WEBHOOK_URL` in `.env.local` |
| Capital.com error | Invalid credentials | Check API key and account ID |

---

## POST-FIRST-TRADE CHECKLIST

- [ ] Trade appears in `/api/history`
- [ ] P&L calculated correctly
- [ ] Position closed properly (stop or target)
- [ ] All ntfy alerts received
- [ ] No errors in server logs
- [ ] Request IDs in all responses

---

## NEXT: GO LIVE

Once first trade succeeds:

1. Verify account is PAPER TRADING (NOT live)
2. Switch Pine Script webhook to production endpoint
3. Set real account size in `.env.local`
4. Monitor first 10 trades manually
5. Enable auto-approval rules (if desired)

---

**Status**: READY FOR FIRST LIVE TEST  
**Last Updated**: 2026-05-22
