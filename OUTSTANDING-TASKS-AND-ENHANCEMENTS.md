# Outstanding Tasks & Enhancements

**Last Updated**: 2026-05-24  
**Status**: Post-Phase 3 P1 (Tasks 1-2 Complete)  
**Target Launch**: 2026-05-25 12:30 ADL

---

## Summary

| Phase | Priority | Status | Effort | Tasks | Timeline |
|-------|----------|--------|--------|-------|----------|
| **Phase 3 P1** | Critical | 40% COMPLETE | 13h | 1-5 | May 24-25 |
| **Phase 3 P2** | High | NOT STARTED | 8h | 6-12 | May 28-31 |
| **Phase 4** | Medium | PENDING | TBD | Operational | June+ |

**Completed**: Tasks 1-2 (Health endpoint + Monitor dashboard)  
**In Progress**: None  
**Blocked**: Tasks 3-5 (depend on real trading data starting May 25)

---

## Phase 3 P1: Critical Monitoring Infrastructure

### ✅ **Task 1: Enhanced Health Check Endpoint** (COMPLETE)
- **Status**: ✅ Done
- **File**: `src/app/api/health/route.ts`
- **Endpoint**: `GET /api/health`
- **Features Implemented**:
  - Latency tracking (database queries, external API calls)
  - Database percentiles (p50, p95)
  - System resource monitoring (memory %, uptime)
  - Component connectivity testing (database, Capital.com, ntfy, TradingView)
- **Build Status**: Passing (0 TypeScript errors)
- **Integration**: Ready to use

### ✅ **Task 2: Trade Execution Monitoring Dashboard** (COMPLETE)
- **Status**: ✅ Done
- **File**: `src/components/TradeExecutionMonitor.tsx`
- **Endpoint**: `GET /api/trades/monitor` (created)
- **Features Implemented**:
  - Today's P&L display with $1,240 target tracking
  - Win/loss metrics and win rate calculation
  - Open positions list with live P&L
  - Confluence score distribution histogram
  - Hourly setup analysis by ADL hour
  - Expected vs actual performance comparison
- **Integration**: Added to main dashboard page with auto-refresh (30 seconds)
- **Build Status**: Passing

---

### 🔄 **Task 3: Slack/Discord Alert Integration** (PENDING)
- **Status**: ⏳ Waiting for May 25 live trading data
- **Priority**: P1 (High) - Operational visibility
- **Effort**: 2 hours
- **Files to Create**:
  - `src/lib/slack-client.ts` — Slack API wrapper
  - `src/lib/discord-client.ts` — Discord API wrapper
  - `src/app/api/alerts/slack/route.ts` — Slack alert endpoint
  - `src/app/api/alerts/discord/route.ts` — Discord alert endpoint

#### What to Implement
```typescript
// Alert types to send:
- Trade execution: "✅ EURUSD BUY executed @ 1.1635 | Risk: $350 | R:R: 5.1:1"
- Trade rejected: "❌ Setup rejected | Reason: Confluence < 70"
- Error alerts: "🔴 CAPITAL.COM API ERROR | Details: [error message]"
- Daily summary: "📊 Today's Summary | Winners: 3 | Losers: 1 | P&L: +$1,240"
- Position update: "📍 Position update | EURUSD BUY | Current P&L: +$150 (+0.43%)"
```

#### Configuration
- Slack webhook URL → `.env.local` (SLACK_WEBHOOK_URL)
- Discord webhook URL → `.env.local` (DISCORD_WEBHOOK_URL)
- Toggle via route: POST `/api/alerts/slack?enable=true`
- Message threading by symbol
- Rate limiting: 1 message per 2 seconds per channel

#### Testing
- [ ] Test Slack message formatting
- [ ] Test Discord embed formatting
- [ ] Verify message delivery during trading hours
- [ ] Check rate limiting doesn't drop messages

#### Timeline: May 28-29 (after initial live trading data collected)

---

### 🔄 **Task 4: Real-Time Position Sync from Capital.com** (PENDING)
- **Status**: ⏳ Blocked on Capital.com integration
- **Priority**: P1 (Critical) - Core functionality
- **Effort**: 3 hours
- **Files to Create/Modify**:
  - `src/lib/capital-client.ts` — Capital.com API client (enhance)
  - `src/app/api/positions/route.ts` — Real-time position endpoint
  - `src/lib/position-sync.ts` — Background sync scheduler

#### What to Implement
```typescript
// GET /api/positions response:
{
  "positions": [
    {
      "id": "12345",
      "symbol": "EURUSD",
      "direction": "BUY",
      "entry_price": 1.1635,
      "current_price": 1.1640,
      "size": 1.0,
      "pnl": 50,
      "pnl_percent": 0.043,
      "stop_loss": 1.1590,
      "take_profit": null,
      "time_opened": "2026-05-24T12:30:00Z",
      "margin_used": 350,
      "margin_percent": 0.44
    }
  ],
  "summary": {
    "total_positions": 1,
    "total_margin_used": 350,
    "total_margin_available": 79650,
    "total_pnl": 50,
    "largest_exposure": "EURUSD"
  }
}
```

#### Background Sync Task
- Runs every 5 minutes during trading hours (09:00-22:00 ADL)
- Fetches Capital.com positions
- Updates `trades` table with:
  - `current_price`
  - `pnl` (calculated real-time)
  - `executed_at` (if just filled)
  - `deal_reference` (if available)
- Logs changes to alert_log
- Triggers ntfy if position hits stop loss

#### Testing
- [ ] Verify positions fetch correctly from Capital.com
- [ ] Test P&L calculation matches Capital.com
- [ ] Check background sync runs on schedule
- [ ] Verify database updates with latest prices
- [ ] Test position exit handling

#### Timeline: May 29-30 (requires Capital.com API key + market conditions)

---

### 🔄 **Task 5: Position Monitoring Widget Enhancement** (PENDING)
- **Status**: ⏳ Depends on Task 4
- **Priority**: P1 (High) - UX refinement
- **Effort**: 2 hours
- **Files to Modify**:
  - `src/components/TradeExecutionMonitor.tsx` (enhance)
  - `src/app/page.tsx` (add widget)

#### Enhancements
```typescript
// Add to TradeExecutionMonitor:
1. Position Cards (detailed view)
   - Click to expand full position details
   - Trade execution time
   - Trade duration (elapsed time)
   - Entry setup details (Stage 1-5 timeline)
   - Exit options (close now, modify SL, etc.)

2. Risk/Reward Progress
   - Distance to target vs stop loss
   - Visual bar showing R:R progress
   - "Target in X pips" / "Stop in X pips"

3. Margin Monitoring
   - Margin used vs available
   - Warning if margin used > 50%
   - Red alert if > 80%

4. Position Actions
   - Quick close buttons (with confirmation)
   - Modify stop loss / take profit
   - Add to watchlist
   - Note/comment field

5. Position History
   - Show recently closed positions (today only)
   - Exit time and exit price
   - Time held
   - Final P&L
```

#### Testing
- [ ] Widget renders all position data correctly
- [ ] Click to expand position shows details
- [ ] Margin monitoring alerts work
- [ ] Quick close button works (with API integration)
- [ ] Position history shows closed trades

#### Timeline: May 30-31 (polish phase)

---

## Phase 3 P2: Testing & Polish

### 🔄 **Task 6: Unit & Integration Tests** (NOT STARTED)
- **Status**: ⏳ Pending
- **Priority**: P2 (High) - Quality assurance
- **Effort**: 3 hours
- **Files to Create**:
  - `src/__tests__/api/health.test.ts` — Health endpoint tests
  - `src/__tests__/api/trades-monitor.test.ts` — Monitor API tests
  - `src/__tests__/api/positions.test.ts` — Positions API tests
  - `src/__tests__/components/TradeExecutionMonitor.test.tsx` — Component tests

#### What to Test

**Health Endpoint Tests** (4-6 tests)
```typescript
- ✅ GET /api/health returns 200 with all components
- ✅ Response includes latency_ms for each component
- ✅ Database percentiles p50 and p95 are present
- ✅ Resource metrics show memory_percent and uptime
- ✅ Error state returns 500 with error details
```

**Trade Monitor Tests** (5-8 tests)
```typescript
- ✅ GET /api/trades/monitor returns MonitorData
- ✅ Positions array populated from database
- ✅ Metrics include daily_winners, daily_losers, win_rate
- ✅ Confluence distribution correct
- ✅ Hourly analysis filtered to 09:00-22:00 ADL
- ✅ Error handling returns error status
- ✅ ADL timezone conversion correct
```

**Component Tests** (5-7 tests)
```typescript
- ✅ Component renders without crashing
- ✅ Auto-refresh toggle works (30-second interval)
- ✅ Error state shows retry button
- ✅ Positions display correct P&L colors
- ✅ Progress bar updates on data change
- ✅ Confluence histogram renders correctly
```

#### Commands
```bash
npm test                    # Run in watch mode
npm run test:coverage       # Coverage report
npm run test:ci             # CI mode (single run)
```

#### Timeline: May 31 (before production)

---

### 🔄 **Task 7: E2E Live Test Script** (NOT STARTED)
- **Status**: ⏳ Manual testing
- **Priority**: P2 (High) - Confidence before launch
- **Effort**: 1.5 hours
- **File**: `scripts/e2e-test.ts` (new)

#### What the Script Should Do
```typescript
// Manual E2E test workflow:

1. Setup
   - Read .env.local for API keys
   - Generate random trade ID
   - Set up test trade parameters

2. Trigger Alert (simulate TradingView webhook)
   - POST /api/alerts with test payload
   - Include X-API-Key header
   - Check response: 202 Accepted

3. Verify Queue Entry
   - Query pending_trades table
   - Confirm entry exists with correct status
   - Check created_at timestamp

4. Check Notification
   - Wait for ntfy.sh notification on phone
   - Verify message includes setup details

5. List Pending Trades
   - GET /api/pending
   - Verify test trade in response
   - Check expiry timer

6. Approve Trade
   - POST /api/pending/[id]/approve
   - Mock Capital.com response
   - Check status changes to 'approved'

7. Verify Execution
   - Check ntfy execution alert sent
   - Verify trade in trades table
   - Check deal_reference populated

8. Cleanup & Report
   - Log all steps with timestamps
   - Generate pass/fail report
   - Save results to file

// Run:
npm run test:e2e
```

#### Success Criteria
- [ ] All 8 steps complete without errors
- [ ] Timing log shows < 5 second round-trip
- [ ] ntfy notifications received on time
- [ ] Database entries created correctly
- [ ] API responses match expected structure

#### Timeline: May 25 (before 12:30 ADL live trading)

---

### 🔄 **Task 8: GitHub Branch Protection Rules** (NOT STARTED)
- **Status**: ⏳ Configuration task
- **Priority**: P2 (Medium) - Long-term maintenance
- **Effort**: 15 minutes (manual GitHub UI)
- **Location**: GitHub repository settings

#### Configuration Steps
1. Go to: `https://github.com/yourusername/your-repo/settings/branches`
2. Add rule for `main` branch:
   - ✅ Require status checks to pass before merging
   - ✅ Select: `ci-web-app` workflow
   - ✅ Require pull request reviews: 1 approval
   - ✅ Dismiss stale pull request approvals
   - ✅ Allow force pushes: No (Block)
   - ✅ Require signed commits: (Optional)

#### Effect
- Prevents merging broken code
- Ensures all tests pass
- Requires peer review
- Blocks accidental force pushes to main

#### Timeline: May 31 (after tests are passing)

---

### 🔄 **Task 9: 15-Minute Monitoring Scheduler** (NOT STARTED)
- **Status**: ⏳ Pending
- **Priority**: P2 (Medium) - Operational automation
- **Effort**: 1.5 hours
- **Files to Create**:
  - `src/lib/scheduler.ts` — Background task scheduler
  - `src/app/api/scheduler/monitor/route.ts` — Scheduled endpoint

#### What the Scheduler Should Do
```typescript
// Runs every 15 minutes during trading hours (09:00-22:00 ADL)
// Executes at: :00, :15, :30, :45 past each hour

const task = {
  name: "15min-monitoring-pulse",
  schedule: "*/15 09-22 * * *", // 15-minute intervals during trading hours
  tasks: [
    // 1. Fetch current prices
    {
      action: "fetch_prices",
      symbols: ["EURUSD", "XAUUSD", "BTCUSD", "AUDUSD"],
      timeout: 5000
    },
    
    // 2. Check stop losses
    {
      action: "check_stops",
      alert_if: "price_below_stop",
      urgency: "CRITICAL"
    },
    
    // 3. Log alert attempts
    {
      action: "log_alerts",
      table: "alert_log"
    },
    
    // 4. Generate summary
    {
      action: "summary",
      include: ["current_positions", "pnl_progress", "setup_quality"]
    },
    
    // 5. Send alerts
    {
      action: "notify",
      channels: ["ntfy", "slack", "discord"],
      if_critical: true
    }
  ]
};

// Sends alert: "📊 Monitoring Pulse (HH:MM ADL) | Positions: 1 | P&L: +$150"
```

#### Error Handling
- Retry failed price fetches (3 attempts)
- Log failures to system_health table
- Send error alert if critical failure
- Continue other tasks even if one fails

#### Testing
- [ ] Scheduler fires at correct times
- [ ] Prices fetched successfully
- [ ] Stop loss checks accurate
- [ ] Alerts sent only when needed
- [ ] Summary includes all metrics

#### Timeline: May 31 (optional, nice-to-have)

---

## Phase 4: Operational (June+)

### 📋 **Daily/Weekly/Monthly Review Framework** (PENDING)
- **Status**: ⏳ Ready to implement
- **Priority**: P3 (High) - Consistent improvement
- **Files to Create**:
  - `DAILY-CHECKLIST.md` — 5-min evening review (22:30 ADL)
  - `WEEKLY-JOURNAL-TEMPLATE.md` — 30-min Sunday review (18:00 ADL)
  - `BI-WEEKLY-SPRINT-TEMPLATE.md` — 45-min Monday tactical (19:00 ADL)
  - `MONTHLY-STRATEGIC-REVIEW-TEMPLATE.md` — 60-min 1st Friday (18:00 ADL)

#### Schedule (Non-Negotiable)
- **Daily**: 22:30 ADL (5 min) — Evening checklist
- **Weekly**: Sunday 18:00 ADL (30 min) — Journal reflection
- **Bi-weekly**: Monday 19:00 ADL (45 min) — Tactical sprint
- **Monthly**: 1st Friday 18:00 ADL (60 min) — Strategic review

#### Timeline: Starting 2026-05-25 (parallel with trading)

---

### 📋 **Real-Time Dashboard Enhancements** (PENDING)
- **Status**: ⏳ Phase 4
- **Priority**: P3 (Medium)
- **Ideas**:
  - [ ] Live PnL leaderboard (daily rankings)
  - [ ] Win rate curve (rolling 7-day)
  - [ ] Setup quality trend (confluence scores over time)
  - [ ] Entry time distribution chart
  - [ ] Best trading hours heatmap
  - [ ] Correlation analysis (EURUSD vs XAUUSD)
  - [ ] Risk-adjusted returns (Sharpe ratio)

#### Timeline: June+ (after initial trading data collected)

---

### 📋 **Capital.com API Enhancements** (PENDING)
- **Status**: ⏳ Pending
- **Priority**: P3 (Medium)
- **Ideas**:
  - [ ] Historical trade sync (import past trades)
  - [ ] Account statement export
  - [ ] Risk analytics (max drawdown, volatility)
  - [ ] Margin utilization tracking
  - [ ] Deposit/withdrawal history
  - [ ] Fee analysis

#### Timeline: June+ (after live trading stabilizes)

---

## Summary by Timeline

### 🔥 **URGENT (Before May 25 12:30 ADL)**
- ✅ Task 1: Health endpoint — DONE
- ✅ Task 2: Monitor dashboard — DONE
- 🔄 Task 7: E2E test script — Run before launch

### ⏳ **HIGH PRIORITY (May 28-29)**
- 🔄 Task 3: Slack/Discord alerts — 2 hours
- 🔄 Task 4: Capital.com position sync — 3 hours

### 📅 **SCHEDULED (May 30-31)**
- 🔄 Task 5: Position widget enhancement — 2 hours
- 🔄 Task 6: Unit & integration tests — 3 hours
- 🔄 Task 8: Branch protection rules — 15 min
- 🔄 Task 9: 15-min monitoring scheduler — 1.5 hours

### 📋 **OPERATIONAL (Starting May 25)**
- 📋 Daily/weekly/monthly reviews — Ongoing

### 🎯 **FUTURE (June+)**
- Dashboard enhancements
- API integrations
- Analytics & reporting

---

## Effort Summary

| Phase | Task | Hours | Status | Dependency |
|-------|------|-------|--------|------------|
| P1 | 1. Health Endpoint | 2.5 | ✅ DONE | — |
| P1 | 2. Monitor Dashboard | 3 | ✅ DONE | Task 1 |
| P1 | 3. Slack/Discord | 2 | 🔄 PENDING | Task 2 |
| P1 | 4. Position Sync | 3 | 🔄 PENDING | Capital.com API |
| P1 | 5. Position Widget | 2 | 🔄 PENDING | Task 4 |
| **P1 Subtotal** | | **12.5h** | **40%** | |
| P2 | 6. Tests | 3 | 🔄 PENDING | Tasks 1-5 |
| P2 | 7. E2E Script | 1.5 | 🔄 PENDING | Tasks 1-5 |
| P2 | 8. Branch Protection | 0.25 | 🔄 PENDING | GitHub |
| P2 | 9. Scheduler | 1.5 | 🔄 PENDING | Task 2 |
| **P2 Subtotal** | | **6.25h** | **0%** | |
| **TOTAL** | | **18.75h** | **40%** | |

---

## Next Steps (Recommended)

1. ✅ **RIGHT NOW (May 24)**: Tasks 1-2 complete
2. 🚀 **TODAY (May 25)**: Run E2E test → Launch live trading 12:30 ADL
3. 📊 **May 28-29**: Implement Tasks 3-4 (alerts + position sync)
4. 🧪 **May 30-31**: Implement Tasks 5-6 (widget + tests)
5. 🔒 **May 31**: Set up branch protection + monitoring scheduler
6. 📈 **June+**: Run daily/weekly/monthly reviews, plan next enhancements

---

**All tasks tracked and ready for execution.**
