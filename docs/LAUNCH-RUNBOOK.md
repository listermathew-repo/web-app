# Trading System Launch Runbook

**Status**: Production Ready  
**Version**: 1.0  
**Last Updated**: 2026-05-26  
**Timezone**: Adelaide (ADL) UTC+9:30  

---

## Pre-Launch Checklist

### ✅ System Components

- [x] Database: SQLite with schema (pending_trades, trades, system_health, alert_log)
- [x] Authentication: X-API-Key header validation
- [x] Trade Approval Queue: 5-minute manual approval window
- [x] Trade Execution: Capital.com API integration (demo account enabled)
- [x] Error Alerting: ntfy.sh notifications
- [x] Health Monitoring: 15-minute interval checks
- [x] Economic Calendar: High-impact event detection
- [x] Auto-pause Logic: 15-minute pause before/after major events
- [x] Dashboard Widgets: Pending trades + positions display
- [x] Tests: Unit tests for all routes
- [x] CI/CD: Branch protection rules

### ✅ Environment Configuration

Verify `.env.local` contains:

```
# API Security
WEBHOOK_API_KEY=e3acbaedddbf49184b9a3c34e3d1c99b
X-API-Key=e3acbaedddbf49184b9a3c34e3d1c99b

# Database
DB_PATH=.db/trading.db

# Capital.com (Demo)
CAPITAL_COM_EMAIL=mathewlister@hotmail.com
CAPITAL_COM_PASSWORD=VXjOO5qoorX$MX
CAPITAL_DEMO_MODE=true

# Notifications
NTFY_TOPIC=mgm-7k4x-live

# Development
API_URL=http://localhost:3000
NODE_ENV=development
```

---

## Launch Day Procedure

### 1. Pre-Flight Check (30 minutes before launch)

```bash
cd /path/to/web-app

# Stop any running dev servers
taskkill /F /IM node.exe  # Windows
# pkill -f "node dev"       # macOS/Linux

# Clean dependencies
rm -rf node_modules
npm install

# Build production bundle
npm run build

# Run E2E test
npm run test:e2e

# Expected output: 5/5 PASS or better
```

If all tests pass ✅, proceed to next step.

### 2. Start Development Server (Production Build)

```bash
npm run start  # Production server
# Or for development with auto-reload:
npm run dev
```

Server should be accessible at:
- Local: `http://localhost:3000`
- Dashboard: `http://localhost:3000/`
- Health check: `http://localhost:3000/api/health`

### 3. Verify All Endpoints

Test each endpoint manually:

```bash
# 1. Health Check
curl http://localhost:3000/api/health

# 2. Pending Trades (empty initially)
curl -H "X-API-Key: e3acbaedddbf49184b9a3c34e3d1c99b" \
  http://localhost:3000/api/pending

# 3. Positions (empty initially)
curl http://localhost:3000/api/positions

# 4. Trading Pause Status
curl http://localhost:3000/api/trading-pause

# 5. Dashboard (visual check)
open http://localhost:3000/
```

All endpoints should respond with HTTP 200 and valid JSON.

### 4. Enable Real-Time Alerts (Optional)

To test ntfy.sh alerts:

```bash
# Send test alert
curl -X POST https://ntfy.sh/mgm-7k4x-live \
  -H "Title: 🚀 System Launch" \
  -H "Priority: 5" \
  -d "Trading system is live and operational"

# You should receive notification on your phone
```

### 5. Connect TradingView Webhook

In TradingView Pine Script, configure alert webhook:

```
URL: http://YOUR_IP:3000/api/alerts
Method: POST
Headers: {"X-API-Key": "e3acbaedddbf49184b9a3c34e3d1c99b"}
Body JSON: {
  "symbol": "{{ticker}}",
  "direction": "{{direction}}",
  "entry_level": {{entry}},
  "stop_level": {{stop}},
  "ema10": {{ema10}},
  "ema21": {{ema21}},
  "vwap": {{vwap}},
  "volume": {{volume}},
  "volume_avg": {{volume_avg}},
  "atr": {{atr}},
  "minutes_since_4h_close": {{time_since_4h}},
  "rsi": {{rsi}},
  "risk_amount": 400,
  "scenario": "scenario_1"
}
```

---

## API Reference

### Trade Alert Webhook

```
POST /api/alerts
X-API-Key: {WEBHOOK_API_KEY}
Content-Type: application/json

{
  "symbol": "EURUSD",
  "direction": "long|short",
  "entry_level": 1.1635,
  "stop_level": 1.1617,
  "risk_amount": 400,
  "scenario": "scenario_1",
  "ema10": 1.1640,
  "ema21": 1.1620,
  "vwap": 1.1635,
  "volume": 350000,
  "volume_avg": 200000,
  "atr": 0.0020,
  "minutes_since_4h_close": 15,
  "rsi": 45
}

Response (202 - Accepted):
{
  "status": "accepted",
  "trade_id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "EURUSD",
  "expires_in_seconds": 300,
  "pending_url": "http://localhost:3000/api/pending/550e8400..."
}

Response (400 - Rejected):
{
  "status": "rejected",
  "reason": "Chart confirmation failed: EMA alignment check failed"
}
```

### Pending Trades List

```
GET /api/pending
X-API-Key: {WEBHOOK_API_KEY}

Response (200):
{
  "count": 2,
  "trades": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "symbol": "EURUSD",
      "direction": "long",
      "entry_level": 1.1635,
      "stop_level": 1.1617,
      "created_at": "2026-05-26T22:10:00Z",
      "expires_at": "2026-05-26T22:15:00Z"
    }
  ]
}
```

### Approve Trade

```
POST /api/pending/{trade_id}/approve
X-API-Key: {WEBHOOK_API_KEY}
Content-Type: application/json

{}

Response (200 - Success):
{
  "status": "executed",
  "trade_id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "EURUSD",
  "deal_reference": "DRF-12345678",
  "executed_at": "2026-05-26T22:11:00Z"
}

Response (410 - Expired):
{
  "status": "rejected",
  "reason": "Trade expired (>5 minutes)"
}

Response (403 - Paused):
{
  "status": "rejected",
  "reason": "⏸ Trading paused: High-impact event: Non-Farm Payroll (NFP)",
  "resumes_at": "2026-05-26T22:45:00Z"
}
```

### Reject Trade

```
POST /api/pending/{trade_id}/reject
X-API-Key: {WEBHOOK_API_KEY}
Content-Type: application/json

{}

Response (200):
{
  "status": "rejected",
  "trade_id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "EURUSD",
  "reason": "Manual rejection"
}
```

### Health Check

```
GET /api/health

Response (200):
{
  "status": "ok",
  "timestamp": "2026-05-26T22:15:00Z",
  "components": ["database", "webhook", "trades", "capital_com", "ntfy"],
  "lastWebhookReceived": "2026-05-26T22:10:00Z",
  "lastTradeExecuted": "2026-05-26T21:45:00Z",
  "errorCount24h": 0
}
```

### Get Positions

```
GET /api/positions

Response (200):
{
  "status": "success",
  "count": 1,
  "positions": [
    {
      "symbol": "EURUSD",
      "entry_price": 1.1635,
      "current_price": 1.1640,
      "pnl": 50,
      "pnl_percent": 0.43,
      "stop_loss": 1.1617,
      "status": "open",
      "deal_reference": "DRF-12345678"
    }
  ],
  "note": "Using live data from Capital.com"
}
```

---

## Monitoring & Operations

### Daily Checklist

- [ ] **09:00 ADL**: Open dashboard, verify all systems green
- [ ] **09:15 ADL**: Check ntfy alerts for overnight health checks
- [ ] **15:30 ADL**: Prepare for trading session (check economic calendar)
- [ ] **22:00 ADL**: Review daily P&L, log session metrics
- [ ] **22:30 ADL**: Archive logs, prepare next trading day

### Alert Types

| Alert | Severity | Action |
|-------|----------|--------|
| ✅ Trade Executed | Info | Monitor position |
| 📋 Trade Pending | Info | Approve/reject within 5 min |
| ⏸ Trading Paused | Warning | Wait for event to clear |
| 🔐 Auth Failed | Critical | Check API key configuration |
| 💾 Database Error | Critical | Check disk space, restart server |
| ⚠️ Capital.com Error | Critical | Verify credentials, fallback to manual mode |

### Health Check Cron Setup

To run health checks every 15 minutes, configure an external cron service:

**Service**: EasyCron, AWS Lambda, GitHub Actions, or Vercel Crons

**Endpoint**: `GET /api/health-check-cron`

**Headers**:
```
Authorization: Bearer {WEBHOOK_API_KEY}
```

**Frequency**: Every 15 minutes (*/15 * * * *)

**Expected Response**:
```json
{
  "status": "completed",
  "passed": true,
  "results": [
    {"component": "database", "status": "ok"},
    {"component": "capital_com", "status": "ok"},
    {"component": "ntfy", "status": "ok"}
  ]
}
```

---

## Troubleshooting

### Issue: "Webhook returns 401 Unauthorized"

**Cause**: Missing or invalid X-API-Key header

**Fix**:
1. Verify Pine Script webhook includes header:
   ```
   Headers: {"X-API-Key": "e3acbaedddbf49184b9a3c34e3d1c99b"}
   ```
2. Check `.env.local` has correct `WEBHOOK_API_KEY`
3. Test with curl:
   ```bash
   curl -H "X-API-Key: e3acbaedddbf49184b9a3c34e3d1c99b" \
     http://localhost:3000/api/alerts
   ```

### Issue: "Trade Approval: Expected 200, got 400 - Trade expired"

**Cause**: 5-minute approval window expired

**Fix**:
1. Approve trades within 5 minutes of alert
2. Check server time is correct (use `date` command)
3. Verify database is storing expires_at correctly

### Issue: "Capital.com API Error: Failed to authenticate"

**Cause**: Credentials invalid or account not activated

**Fix**:
1. Verify credentials in `.env.local`
2. Test credentials at https://www.capital.com/
3. Enable demo mode: `CAPITAL_DEMO_MODE=true`
4. Check account status: https://www.capital.com/account-settings

### Issue: "Database locked"

**Cause**: Multiple processes accessing SQLite simultaneously

**Fix**:
1. Stop all running instances: `taskkill /F /IM node.exe`
2. Delete `.db/trading.db` to reset (backup first)
3. Restart: `npm run dev`
4. Increase SQLite timeout in `db.ts`: `timeout: 5000`

### Issue: "No alerts received - Economic calendar blocking"

**Cause**: High-impact event is within 15-minute pause window

**Fix**:
1. Check `/api/trading-pause` endpoint
2. Wait for event time + 15 minutes
3. Or temporarily disable pause logic in `trading-pause.ts`

---

## Deployment to Production (Vercel)

### 1. Configure Vercel Environment

```bash
# Set environment variables in Vercel dashboard
vercel env add WEBHOOK_API_KEY
vercel env add CAPITAL_COM_EMAIL
vercel env add CAPITAL_COM_PASSWORD
vercel env add NTFY_TOPIC
```

### 2. Deploy

```bash
# Deploy to production
vercel --prod

# Verify deployment
curl https://your-domain.vercel.app/api/health
```

### 3. Configure Cron Jobs (Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/health-check-cron",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## Performance Tuning

| Optimization | Impact | Difficulty |
|--------------|--------|------------|
| Cache VWAP calculations (5 min TTL) | +15% latency | Low |
| Parallel health checks | -40% check time | Low |
| Index pending_trades.created_at | +20% query speed | Low |
| Connection pooling | -30% DB overhead | Medium |
| Redis cache layer | +50% throughput | Medium |
| API rate limiting (100/min) | +security | Low |

---

## Scaling for Multiple Accounts

To scale from 1 account to 4 funded accounts:

1. Duplicate `.env` → `.env.account-2`, etc.
2. Run separate instances: `PORT=3001 npm run dev`
3. Load balance with Nginx or AWS ALB
4. Use separate databases per account or consolidated with account ID field
5. Deploy to separate Vercel projects or monorepo with matrix CI

---

## Success Criteria

✅ **Launch is successful when**:

- [ ] E2E test: 5/5 PASS
- [ ] Dashboard loads without errors
- [ ] Trade webhook accepted (202 response)
- [ ] Pending trade listed in /api/pending
- [ ] Manual approval executes trade on Capital.com (demo)
- [ ] ntfy.sh receives success notification
- [ ] Health check passes all components
- [ ] No database errors in logs
- [ ] Economic calendar shows upcoming events
- [ ] Auto-pause blocks trading during high-impact events

---

## Post-Launch Monitoring

Monitor these metrics for 7 days:

- **Webhook success rate**: Target > 99%
- **Trade approval latency**: Target < 5 seconds
- **API uptime**: Target > 99.9%
- **Database size**: Monitor growth (expect 100KB/day)
- **ntfy.sh delivery**: Target 100% (check notifications)

---

## Emergency Procedures

### Immediate Shutdown

If critical issue:

```bash
taskkill /F /IM node.exe  # Kill server
# Check logs for errors
# Fix issue
# Restart: npm run dev
```

### Rollback to Last Known Good State

```bash
git revert HEAD
npm install
npm run dev
```

### Manual Trade Execution (If API Down)

1. Use Capital.com web interface: https://platform.capital.com/
2. Enter trade details manually
3. Log trade in database manually
4. Resume API when fixed

---

## Support & Escalation

| Issue | Owner | Escalation |
|-------|-------|------------|
| API errors | Claude | Check logs, restart server |
| Capital.com errors | User | Contact Capital.com support |
| Database errors | Claude | Rebuild database, restore from backup |
| ntfy.sh errors | Check ntfy.sh status | Use email as fallback |
| TradingView errors | User | Check Pine Script syntax, verify webhook URL |

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-26 22:30 ADL  
**Next Review**: 2026-06-26  

✨ **Go live with confidence!** ✨
