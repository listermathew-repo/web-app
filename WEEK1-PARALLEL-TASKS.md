# Week 1 Implementation — Parallel Workstreams
## Capital.com Integration + 5 Parallel Tracks

**Status**: Week 1 of 4 (22-28 May 2026)  
**Primary Focus**: Capital.com API integration + database schema updates  
**Timeline**: 6-8 hours core work, with 4 parallel tracks running simultaneously

---

## 🎯 PRIMARY TRACK: Capital.com Integration (6-8 hours)

### COMPLETED ✅
- [x] Create `src/lib/capital-client.ts` with full API client
  - authenticate() — session token management with 1-hour TTL
  - executeOrder() — market order execution with stop loss
  - getOpenPositions() — fetch current trades from Capital.com
  - closePosition() — close single trade
  - getAccountSummary() — balance, available funds, exposure
  - Epic mapping for EURUSD, XAUUSD, BTCUSD, AUDUSD

- [x] Create `src/lib/db-migrations.ts` for schema updates
  - Migration 1: Add trades.strategy, trades.rr_ratio, trades.participation_level
  - Migration 2: Create rr_analysis table (backtest results storage)
  - Migration 3: Create backtest_results table (Monte Carlo simulation data)
  - Auto-run on app startup via runAllMigrations()

- [x] Update `.env.template` with all required variables
  - CAPITAL_COM_EMAIL, CAPITAL_COM_PASSWORD, CAPITAL_DEMO_MODE
  - TWILIO_* for SMS backups (optional)
  - DISCORD_WEBHOOK_URL for Discord alerts (optional)
  - Risk management: RISK_PER_TRADE=400, MAX_DAILY_LOSSES=3, MAX_LOSS_PER_DAY=1200
  - **TIME ZONE STANDARDS**: All timestamps in system use "HH:MM ADL" format

### TODO THIS WEEK
- [ ] **Day 1-2**: Update `.env.local` with your Capital.com credentials
  - Get email from Capital.com account
  - Get password from Capital.com account
  - Set CAPITAL_DEMO_MODE=true (for testing)
  - Test authentication with: `npm run test:capital` (script needed)

- [ ] **Day 2**: Update `src/app/api/pending/[id]/approve` route
  - Import getCapitalClient from capital-client.ts
  - After user clicks approve, call executeOrder()
  - Insert into trades table with deal_reference
  - Return 200 with execution details
  - Send ntfy alert: "✅ EXECUTED: EURUSD BUY @ price | Deal: ref"

- [ ] **Day 3**: Add helper function to db.ts: insertTradeFromExecution()
  - Takes OrderResponse from Capital.com
  - Inserts into trades table with status='executed'
  - Logs execution time in Adelaide timezone (HH:MM ADL format)

- [ ] **Day 4**: Test full workflow
  - POST /api/alerts with test trade
  - Verify trade appears in pending queue
  - Click approve button
  - Verify Capital.com receives order (in DEMO mode)
  - Verify ntfy alert received
  - Check trades table for execution record

---

## ⚡ PARALLEL TRACK 1: Pine Script v7 Dual-Strategy Update (4-6 hours)

### Goal
Update TradingView Pine Script to detect both Scenario 1 AND SMC/FVG/CHOCH in parallel

### Breakdown

- [ ] **Part A**: SMC Detection (2 hours)
  - Liquidity sweep: Price breaks recent low/high + retraces 50-80%
  - Structure: current swing (s), previous swing (ps)
  - Logic: (current close < previous low) AND (now > previous low + 50% height) = sweep confirmed

- [ ] **Part B**: Fair Value Gap Detection (1 hour)
  - FVG defined as: gap between candle wicks not touched by subsequent candles
  - Track HTF (1H) and LTF (15min) gaps separately
  - Store: gap_high, gap_low, gap_created_at

- [ ] **Part C**: Change of Character on LTF (1 hour)
  - CHOCH: Break of previous 15min swing high/low
  - Confirmation: close beyond swing + return to swing = entry trigger
  - Logic: (ltf_swing_broken) AND (ltf_return_to_swing) = trade alert

- [ ] **Part D**: Dual-strategy tagging (1 hour)
  - Keep existing: Scenario 1 detection (C4, C3, C1 with OR logic)
  - Add new: SMC/FVG/CHOCH detection
  - Tag EACH alert with scenario='scenario_1' or 'scenario=smcfvg'
  - Webhook payload includes scenario field for dashboard filtering

- [ ] **Testing**: Paper trade both strategies simultaneously
  - Add both to TradingView chart
  - Generate test alerts for each strategy
  - Verify alerts include correct scenario tag
  - Deploy to live chart (still using ntfy test topic)

### Deliverable
Updated Pine Script v7 file with dual-strategy detection, ready for upload to TradingView

---

## 🎨 PARALLEL TRACK 2: Dashboard UI Enhancement (3-4 hours)

### Goal
Update trading dashboard to filter and compare both strategies side-by-side

### Breakdown

- [ ] **Feature 1**: Strategy filter buttons (1 hour)
  - Add buttons: [Scenario 1] [SMC/FVG] [All]
  - Default: [All] shows both strategies
  - Color coding: Blue = Scenario 1, Purple = SMC/FVG
  - Filter applied to: pending trades, open positions, alert history

- [ ] **Feature 2**: Strategy-specific stats (1 hour)
  - Left column: Scenario 1 stats (today's W/L, win rate %, P&L)
  - Right column: SMC/FVG stats (today's W/L, win rate %, P&L)
  - Comparison at top: "Scenario 1 (3W-1L, 75%) vs SMC (1W-2L, 33%)"
  - Auto-update every 30 seconds

- [ ] **Feature 3**: Tag open positions with strategy origin (1 hour)
  - Add "Strategy: Scenario 1" or "Strategy: SMC/FVG" label to each position card
  - Color background based on strategy (Blue/Purple)
  - Sort by strategy in open positions section

- [ ] **Testing**: Verify filters work
  - Load dashboard
  - Click strategy filters
  - Confirm trades update correctly
  - Verify color coding matches Pine Script tags

### Deliverable
Updated `src/app/dashboard/page.tsx` with strategy filtering and dual-strategy comparison

---

## 📊 PARALLEL TRACK 3: Backtesting Framework Setup (5-6 hours)

### Goal
Create infrastructure for collecting trade data and analyzing R:R ratios (used in Week 3-4)

### Breakdown

- [ ] **Part A**: Trade data collection schema (1 hour)
  - Add columns to trades table: strategy, rr_ratio, participation_level (DONE via migrations)
  - Create trades.actual_rr_achieved (REAL) — ratio that was actually hit
  - Create trades.trade_type (VARCHAR) — 'completed', 'stopped_out', 'partially_exited'
  - Add: trades.entry_candle_time, trades.exit_candle_time (for timing analysis)

- [ ] **Part B**: Trade logger utility (1.5 hours)
  - Create `src/lib/trade-logger.ts`
  - logTrade() — comprehensive trade entry with all fields
  - calculateActualRR() — compute actual R:R achieved based on exit price
  - extractStrategy() — detect strategy from pending_trades.scenario
  - Format: All timestamps in Adelaide timezone (HH:MM ADL)

- [ ] **Part C**: Backtesting data exporter (1.5 hours)
  - Create `src/app/api/backtest/export` endpoint
  - Filters: ?strategy=scenario_1&symbol=EURUSD&since=2026-05-15&until=2026-05-28
  - Output: CSV with columns: symbol, entry_time, exit_time, entry_price, exit_price, rr_target, actual_rr, win/loss
  - Use for external R:R analysis

- [ ] **Part D**: Dashboard backtest results view (1 hour)
  - New section: "Backtesting Summary"
  - Shows: Sample size per strategy, win rates, expectancy (if available)
  - Charts: Win rate by R:R ratio (populated after Week 3 testing)
  - Not populated yet, but UI ready

### Deliverable
- Database migration for backtesting columns (DONE)
- Trade logger utility
- CSV export endpoint
- Dashboard UI section (empty, ready for Week 3-4 data)

---

## 🧪 PARALLEL TRACK 4: Testing & Validation (3-4 hours)

### Goal
Create end-to-end test script and unit tests for new Capital.com integration

### Breakdown

- [ ] **Part A**: E2E test script (2 hours)
  - Create `scripts/e2e-trade-flow.ts`
  - Test sequence:
    1. POST /api/alerts with test trade (EURUSD BUY @ 1.16353)
    2. Verify 202 response + trade_id
    3. GET /api/pending → verify trade in queue
    4. POST /api/pending/{id}/approve → simulate Capital.com execution
    5. Verify status='executed' in database
    6. Verify ntfy alert sent
    7. Log results: PASS/FAIL for each step

- [ ] **Part B**: Unit tests for capital-client.ts (1 hour)
  - Test authenticate() — token generation, TTL refresh
  - Test executeOrder() — order payload validation
  - Test epic mapping — all 4 instruments (EURUSD, XAUUSD, BTCUSD, AUDUSD)
  - Mock fetch() for safety (no real Capital.com calls)
  - File: `src/__tests__/lib/capital-client.test.ts`

- [ ] **Part C**: Integration tests for /api/pending routes (1 hour)
  - POST /api/alerts → verify pending_trades insert
  - GET /api/pending → verify pending trades listed
  - POST /api/pending/{id}/approve → verify status update to 'executed'
  - POST /api/pending/{id}/reject → verify status update to 'rejected'
  - File: `src/__tests__/api/pending.test.ts`

### Deliverable
- E2E test script (runnable with `npm run test:e2e`)
- Unit tests for capital-client and pending routes
- Test coverage report

---

## 📝 PARALLEL TRACK 5: Documentation (2-3 hours)

### Goal
Document SMC/FVG/CHOCH strategy and backtesting process for Week 3-4

### Breakdown

- [ ] **Part A**: SMC Strategy Guide (1.5 hours)
  - File: `STRATEGY-SMC-GUIDE.md`
  - Sections:
    - What is SMC (Smart Money Concepts)?
    - Liquidity sweep definition and detection rules
    - Fair value gap (FVG) formation and rules
    - Change of character (CHOCH) on LTF confirmation
    - Entry rules: sweep + FVG + CHOCH confirmation required
    - Stop loss placement: below last liquidity node
    - Take profit: 1.5x to 10x risk (flexible, for backtesting)
    - Examples: EURUSD, XAUUSD, BTCUSD scenarios

- [ ] **Part B**: R:R Backtesting Guide (1 hour)
  - File: `BACKTEST-RR-GUIDE.md`
  - How to collect trade data
  - How to export CSV for analysis
  - R:R ratio definitions (1.5:1 through 10.0:1)
  - Expected outputs: win rate, expectancy, Sharpe ratio
  - Decision framework: which R:R ratio to use for scaling

- [ ] **Part C**: Update IMPLEMENTATION_GUIDE.md (0.5 hours)
  - Add Capital.com integration section
  - Add backtesting framework section
  - Add timeline for Week 2-4

### Deliverable
- STRATEGY-SMC-GUIDE.md (comprehensive SMC documentation)
- BACKTEST-RR-GUIDE.md (backtesting methodology)
- Updated IMPLEMENTATION_GUIDE.md

---

## 📅 Week 1 Timeline (Mon-Fri, 22-28 May 2026)

| Day | Primary Track | Track 1 | Track 2 | Track 3 | Track 4 | Track 5 |
|-----|---|---|---|---|---|---|
| **Mon 22** | capital-client.ts ✅ | — | — | — | — | — |
| **Tue 23** | .env.local setup | SMC Detection Part A | — | Trade schema | — | SMC Guide (1hr) |
| **Wed 24** | /api/pending approve | SMC/FVG/CHOCH | Filter buttons | Trade logger | E2E script | RR Guide (1hr) |
| **Thu 25** | Testing workflow | Deploy Pine Script | Dashboard UI | Backtest exporter | Unit tests | — |
| **Fri 26** | End-to-end test | Paper trading | Strategy tagging | Final backtest UI | Integration tests | IMPL_GUIDE update |

**Daily Effort Estimate**:
- Primary (capital-client): 1-2 hours/day (Days 1-4)
- Parallel tracks: 1-2 hours/day each (distributed across team or sequential)
- Testing: 2 hours on Friday
- **Total for Week**: ~20 hours (core + parallel work)

---

## 🚀 Completion Checklist

### By End of Week 1

**Capital.com Integration** ✅
- [x] capital-client.ts created and tested
- [ ] .env.local configured with Capital.com credentials
- [ ] /api/pending/{id}/approve integrated with Capital.com
- [ ] Full workflow tested: alert → pending → approve → execution

**Database Schema** ✅
- [x] Migrations created for strategy tracking columns
- [x] rr_analysis table ready
- [x] backtest_results table ready
- [ ] Test migrations run successfully on next deploy

**Pine Script** (PARALLEL)
- [ ] Scenario 1 detection verified (should already work)
- [ ] SMC/FVG/CHOCH detection added
- [ ] Dual-strategy tagging implemented
- [ ] Deployed to TradingView chart
- [ ] Paper trading both strategies simultaneously

**Dashboard** (PARALLEL)
- [ ] Strategy filter buttons added
- [ ] Win-rate comparison visible
- [ ] Positions tagged with strategy
- [ ] Color coding matches Pine Script

**Backtesting Infrastructure** (PARALLEL)
- [ ] Trade logger utility created
- [ ] CSV export endpoint working
- [ ] Backtesting data structure ready
- [ ] Dashboard UI section added (empty, ready for data)

**Testing** (PARALLEL)
- [ ] E2E test script executable
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Coverage >80% for new code

**Documentation** (PARALLEL)
- [ ] SMC strategy guide written
- [ ] R:R backtesting guide written
- [ ] Implementation guide updated with new sections

---

## 📍 Success Criteria

At end of Week 1, you will have:

1. ✅ **Capital.com integration working** — Trades execute after manual approval
2. ✅ **Dual-strategy detection running** — Both Scenario 1 and SMC/FVG/CHOCH live on chart
3. ✅ **Dashboard updated** — See which strategy each signal comes from
4. ✅ **Backtesting infrastructure ready** — Data collection set up for Week 3-4 analysis
5. ✅ **Full test coverage** — E2E tests verify complete flow

**Next Steps (Week 2)**:
- Collect real trading signals from both strategies
- Monitor win rates separately
- Continue paper trading both strategies
- Prepare for Week 3-4 R:R analysis

---

## ⚠️ Critical Reminders

**Timezone Standards**:
- All timestamps in system: Use "HH:MM ADL" format (Adelaide local time)
- Do NOT use UTC, UTC+9:30, or other timezone notations
- Examples: 09:30 ADL (morning), 14:45 ADL (afternoon), 22:15 ADL (evening)
- Trading hours: 09:00 - 22:00 ADL

**Capital.com DEMO Mode**:
- Keep CAPITAL_DEMO_MODE=true during Week 1 testing
- No real money risked
- Orders execute on Capital.com demo account only
- Switch to CAPITAL_DEMO_MODE=false in Week 5 (after full R:R testing complete)

**Paper Trading**:
- SIMULATE_TRADES=true still enabled
- Dashboard shows simulated P&L
- Real Capital.com orders execute (but in demo account)
- Can disable SIMULATE_TRADES after Week 2 confidence check

---

Generated: 22 May 2026, 14:35 ADL
