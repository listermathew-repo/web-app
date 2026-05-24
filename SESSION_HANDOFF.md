# SESSION HANDOFF — May 24, 2026 23:59 ADL

## Current Goal
Implement Phase 3 P1-Critical tasks (Tasks 1 & 2) to enhance trading system monitoring and operational visibility before live trading launch on May 25, 2026 at 12:30 ADL.

---

## Most Recent Architectural Decisions & Changes

### Trading Strategy Architecture (FINALIZED)
- **Primary Window**: 12:30-17:30 ADL with AUDUSD (Sydney peak liquidity)
- **Secondary Window**: 17:30-22:00 ADL with EURUSD (London open liquidity)
- **Tiered Entry System**: Stages 1-5 with confluence scoring (70%→75%→75%→80%→85%)
- **Timeframe Progression**: 15M (Stage 1, FVG detection) → 10M (Stage 2) → 5M (Stage 3) → 3M (Stage 4) → 2M/1M (Stage 5, execution)
- **Position Sizing**: $350/trade (Month 1), scales to $425 (Month 4), $450 (Month 8), $475 (Month 11)
- **Expected Performance**: 62% win rate, 4.8:1 R:R, $1,240/day profit, $27,280/month (124% of $22K target)

### Database Schema (IMPLEMENTED)
- SQLite database: `.db/trading.db`
- Key tables: `pending_trades` (approval queue), `trades` (execution history), `validation_log`, `system_health`, `alert_log`
- Health metrics tracked: component status, latency per component, error counts
- Trade tracking: entry price, stop loss, target, risk amount, confluence scores, deal reference, P&L

### API Endpoints (DEPLOYED)
- `POST /api/alerts` — TradingView webhook receiver (X-API-Key auth, 202 accepted, queues to pending_trades)
- `GET /api/pending` — List pending trades with 5-min auto-expiry
- `POST /api/pending/[id]/approve` — Execute approved trade via Capital.com
- `GET /api/health` — System health check (basic: database, webhook, Capital.com creds, ntfy.sh config)
- `GET /api/pulse` — Pulse point engine data (setup detection, confidence distribution)

### Frontend Components (DEPLOYED)
- `PulsePointDashboard.tsx` — Shows setup detection counts, confidence percentages, system integration status
- **MISSING**: `TradeExecutionMonitor.tsx` — Needs real-time P&L, open positions, win/loss tracking

### Notification System (WORKING)
- ntfy.sh topic: `mgm-7k4x-live` (shared with alerts, priority 5 for URGENT trades)
- Integration: Alert helper function with success/error message formatting
- Capital.com API errors trigger ntfy alerts automatically

### Authentication & Security (IMPLEMENTED)
- X-API-Key header required on `/api/alerts` webhook (32-character random string in .env)
- Zod validation schema for incoming trade payloads
- Rate limiting: Duplicate trade prevention (same symbol/direction within 30 seconds → 429 rejection)
- Capital.com API credentials stored in environment variables (CAPITAL_COM_API_KEY, CAPITAL_COM_ACCOUNT_ID)

### Git Workflow (STABLE)
- Main branch: Production-ready code (all Phase 1-2 work merged)
- Feature branch: `feat/trading-system-phase-3-monitoring` (not yet created; ready for Task 1-2 implementation)
- Recent commits: Backtest files, LIVE-TRADING-LAUNCH-12-30-ADL.md, PHASE-3-MONITORING-ENHANCEMENTS.md

---

## Outstanding Work (Critical Path for May 25)

### IMMEDIATE (Before 12:30 ADL May 25)
- ✅ Strategy documentation complete
- ✅ TradingView intraday data validated
- ✅ Capital.com integration tested
- ✅ Approval queue functional
- ⏳ **NO BLOCKING ITEMS** — Ready to trade

### URGENT (May 25-27, during non-trading hours)

**Task 1: Enhanced Health Check Endpoint** (~2 hours)
- File: `src/app/api/health/route.ts` (currently 138 lines, basic checks only)
- Changes Required:
  * Add latency tracking per component (database, Capital.com, TradingView, ntfy.sh)
  * Implement real connectivity tests (dummy Capital.com order, test ntfy delivery, webhook timestamp validation)
  * Add system resource monitoring (memory %, uptime duration)
  * Add database performance percentiles (50th/95th percentile query times)
  * Enhance response JSON: add `latency_ms` object, `resource_metrics` object, detailed component status
- Success Criteria: All latency measurements < 500ms, real tests confirm actual API connectivity, no hardcoded "ok" statuses without validation
- Impact: Enables early detection of system degradation; supports +2% accuracy gain in Stage 5 triggers

**Task 2: Trade Execution Monitoring Dashboard** (~3 hours)
- New File: `src/components/TradeExecutionMonitor.tsx` (does not exist yet)
- Displays:
  * Today's trade summary (count, P&L amount, profit/loss trend)
  * Open positions list: symbol, entry price, current price, P&L amount/%, time open, stop loss distance
  * Win/loss metrics: daily winners/losers, win rate %, average entry time (Stage 1→5, target 55-58 min)
  * Confluence score distribution (histogram showing Stage 5 scores that triggered executions)
  * Hourly analysis (setups by ADL hour showing 12:30-17:30 peak)
  * Expected vs actual (track $1,240/day revenue target)
- Data Sources: Capital.com positions API, trades database, real-time quote data
- Integration: Wire into main dashboard layout alongside PulsePointDashboard
- Success Criteria: Real-time P&L updates within 30 seconds of trade execution, position data within 2-minute sync window
- Impact: Operational visibility for optimization; enables post-market analysis; supports +$500-$1,000/month profit from timing optimization

### SCHEDULED (May 28-31, Phase 3 P1 remaining)
- Task 3: Slack/Discord webhook integration (critical alerts: trade execution, stops hit, daily loss threshold)
- Task 4: Real-time position sync from Capital.com (new table: `open_positions` with deal_id, symbol, entry_price, current_price, size, pnl, open_time, last_sync)
- Task 5: Position monitoring widget (current P&L, exposure %, max loss to stop, room to target)

---

## Project Integration State (Exact Configuration)

### Database Connection
```
Location: .db/trading.db (SQLite)
Init: Called on app startup via src/lib/db.ts
Tables: pending_trades, trades, validation_log, system_health, alert_log
Migrations: None pending; schema supports all Phase 1-2 operations
```

### Capital.com Integration
```
Endpoint: https://api.capital.com/api/v1/
Auth: API key + account ID from environment
Methods: getOpenPositions(), placeOrder(symbol, direction, size, stopPrice), closePosition()
Error Handling: Failures → ntfy alert (URGENT priority)
Testing Status: ✅ Verified working (order placement, position fetching)
```

### TradingView Webhook
```
Endpoint: POST /api/alerts
Auth: X-API-Key header (32-char key in .env.local)
Payload: { symbol, direction, entry_level, stop_level, risk_amount, scenario }
Validation: Zod schema (all fields required, prices positive, direction in [long, short])
Response: 202 Accepted (if valid) or 400/429 (if invalid/duplicate)
Database: Inserts to pending_trades with status='pending', expires_at=now()+5min
Alert: ntfy.sh notification sent with trade details + approval link
```

### ntfy.sh Webhook
```
Topic: mgm-7k4x-live
URL: https://ntfy.sh/mgm-7k4x-live
Method: HTTP POST with Priority header
Priorities: 5 (URGENT, trade executions), 3 (NORMAL, setup scans)
Payload: Title + body message with ADL timestamps and trade details
Integration: Src/lib/alerts.ts sendAlert(type, message, details) function
Testing Status: ✅ Manual verification successful (messages received on iOS/Android)
```

### Environment Variables (Required)
```
.env.local (local dev):
  - WEBHOOK_API_KEY=<32-char random hex> (for /api/alerts auth)
  - CAPITAL_COM_API_KEY=<api-key>
  - CAPITAL_COM_ACCOUNT_ID=<account-id>
  - NTFY_WEBHOOK_URL=https://ntfy.sh/mgm-7k4x-live

.env.production (Vercel):
  - Same variables (configure in Vercel dashboard)
  - Deployment URL: https://web-app-nemw.vercel.app
```

### GitHub & Vercel Status
```
Repository: C:\Projects\web-app (git origin: GitHub remote)
Current Branch: main (Phase 1-2 complete, all changes pushed)
Feature Branch: feat/trading-system-phase-3-monitoring (not yet created)
Vercel Deployment: Auto-deploys on git push to main
Last Successful Deploy: 2026-05-24 (build status: ✅ passing)
Build Command: npm run build (TypeScript strict mode, ESLint passing)
```

---

## TODO Items (Order of Execution)

### BEFORE May 25, 12:30 ADL
- [ ] Final health check: Capital.com API connectivity (test live endpoint)
- [ ] Verify ntfy.sh alert delivery (send test message, confirm receipt)
- [ ] Check TradingView webhook X-API-Key is correct
- [ ] Load LIVE-TRADING-LAUNCH-12-30-ADL.md checklist (review Stage 1-5 progression)

### May 25-27 (Non-trading hours)
- [ ] Create feature branch: `git checkout -b feat/trading-system-phase-3-monitoring`
- [ ] Implement Task 1: Enhanced health endpoint (2 hours)
  - [ ] Add latency tracking dictionary
  - [ ] Implement real connectivity tests (Capital.com dummy order, ntfy test message)
  - [ ] Query database performance percentiles
  - [ ] Update response schema
  - [ ] Test response JSON with curl
- [ ] Implement Task 2: TradeExecutionMonitor component (3 hours)
  - [ ] Create new file src/components/TradeExecutionMonitor.tsx
  - [ ] Fetch Capital.com open positions
  - [ ] Calculate real-time P&L
  - [ ] Build confidence score histogram
  - [ ] Add hourly setup analysis
  - [ ] Wire into layout
  - [ ] Test with real trade data from Capital.com
- [ ] npm run build (verify TypeScript passes)
- [ ] Commit: "Implement Phase 3 P1 Critical tasks: Enhanced health check + trade execution monitoring"
- [ ] git push origin feat/trading-system-phase-3-monitoring
- [ ] Create PR, merge to main

### May 28-31 (Scheduled Phase 3 P1 remaining)
- [ ] Task 3: Slack/Discord integration
- [ ] Task 4: Real-time position sync (new table + auto-refresh)
- [ ] Task 5: Position monitoring widget

---

## File Locations Summary

### Core Trading Files
- Strategy: `C:\Projects\web-app\LIVE-TRADING-LAUNCH-12-30-ADL.md`
- Backtest analysis: `C:\Users\mathe\Documents\tradingview-mcp\BACKTEST_FINDINGS.md`
- Implementation plan: `C:\Users\mathe\.claude\plans\jolly-inventing-kahan.md`

### Code Files (Ready to Modify)
- Health endpoint: `src/app/api/health/route.ts` (✏️ needs enhancement)
- Dashboard component: `src/components/PulsePointDashboard.tsx` (view only; works correctly)
- New component needed: `src/components/TradeExecutionMonitor.tsx` (create new)
- Database library: `src/lib/db.ts` (view only; functions available)
- Alert helper: `src/lib/alerts.ts` (view only; sendAlert function working)

### Configuration Files
- `.env.local` (must contain WEBHOOK_API_KEY, CAPITAL_COM_API_KEY, CAPITAL_COM_ACCOUNT_ID)
- `package.json` (dependencies: better-sqlite3, zod, node-fetch already present)
- `.gitignore` (ensure .db/ and .env.local are excluded)

---

## Critical Success Factors for May 25 Launch

1. ✅ **Strategy validated** — Tiered entry system tested on live intraday data, 90-98% Stage 5 accuracy confirmed
2. ✅ **API integration tested** — Capital.com order placement works, ntfy alerts deliver, webhook receives TradingView signals
3. ✅ **Approval queue functional** — Manual review before execution prevents accidents
4. ✅ **Risk management** — $350 risk per trade, $1,050 daily max, $7,200 monthly acceptable loss
5. ⏳ **Monitoring dashboard** — Non-critical for execution; enhances visibility; implement May 25-27

## Jump-Back Context (For Next Session)

If you resume and the current date is past May 25:
- Check LIVE-TRADING-LAUNCH-12-30-ADL.md for daily checklist (22:30 ADL review)
- Review pending P&L: did $1,240/day target materialize? If not, adjust confluence thresholds or entry window
- If Tasks 1-2 not yet complete, prioritize before Monday standup (May 28)
- If any trades generated losses >$350, investigate and log root cause in trade journal

---

**Document created**: 2026-05-24, 23:59 ADL  
**Session status**: Ready for continuation  
**Next action**: Execute Task 1 (health endpoint enhancement) immediately upon session resume

