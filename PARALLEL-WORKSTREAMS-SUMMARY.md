# Parallel Workstreams Summary
## What Can Be Delivered Simultaneously with Capital.com Integration

**Primary Focus**: Capital.com API client + database schema updates  
**Parallel Capacity**: 4 additional independent workstreams running simultaneously  
**Total Week 1 Output**: 5 complete features (not just Capital.com)  

---

## 📊 Parallel Delivery Matrix

```
PRIMARY (Capital.com Integration)
├─ Days 1-4: capital-client.ts implementation ✅
├─ Days 2-3: Database migrations ✅
├─ Days 3-4: .env setup + approve endpoint
└─ Day 5: Full workflow testing

PARALLEL TRACK 1: Pine Script Enhancement (4-6 hours)
├─ SMC/FVG/CHOCH detection logic
├─ Dual-strategy tagging (scenario='scenario_1' or 'smcfvg')
├─ Live paper trading both strategies
└─ Deploy to TradingView

PARALLEL TRACK 2: Dashboard UI (3-4 hours)
├─ Strategy filter buttons ([Scenario 1] [SMC] [All])
├─ Win-rate comparison display
├─ Position strategy tagging & color coding
└─ Auto-refresh every 30 seconds

PARALLEL TRACK 3: Backtesting Framework (5-6 hours)
├─ Trade data collection schema (migrations done ✅)
├─ Trade logger utility (src/lib/trade-logger.ts)
├─ CSV export endpoint (/api/backtest/export)
└─ Dashboard backtest results section (UI ready)

PARALLEL TRACK 4: Testing & Documentation (5-6 hours)
├─ E2E test script (full workflow validation)
├─ Unit tests for capital-client.ts
├─ SMC strategy guide (STRATEGY-SMC-GUIDE.md)
├─ R:R backtesting guide (BACKTEST-RR-GUIDE.md)
└─ Integration tests for /api/pending routes
```

---

## 🎯 Track-by-Track Breakdown

### PRIMARY: Capital.com Integration (6-8 hours)

**Deliverables**:
- ✅ `src/lib/capital-client.ts` (340 lines) — Complete Capital.com REST API client
  - authenticate() with session token management
  - executeOrder() for market orders with automatic stop loss
  - getOpenPositions() for position tracking
  - closePosition() for position closure
  - getAccountSummary() for balance & exposure
  - Epic mapping for all 4 instruments (EURUSD, XAUUSD, BTCUSD, AUDUSD)

- ✅ `src/lib/db-migrations.ts` (150 lines) — Automatic schema upgrades
  - Migration 1: Add strategy tracking columns
  - Migration 2: Create rr_analysis table
  - Migration 3: Create backtest_results table
  - Auto-run on app startup, idempotent (safe to run multiple times)

- ✅ `.env.template` — Configuration guide with all variables
  - Capital.com credentials
  - DEMO mode (default=true, safe)
  - SMS/Discord backup options
  - Risk management settings

**Status**: ✅ COMPLETE TODAY (files created)

**Remaining**:
- [ ] Update .env.local with credentials (10 min)
- [ ] Deploy to Vercel (5 min)
- [ ] Test Capital.com auth (20 min)
- [ ] Integrate with /api/pending/{id}/approve (45 min)
- [ ] Full workflow test (30 min)

**Total Remaining**: ~2 hours

---

### PARALLEL TRACK 1: Pine Script v7 Dual-Strategy (4-6 hours)

**Goal**: Update TradingView Pine Script to detect both Scenario 1 AND SMC/FVG/CHOCH in parallel

**Deliverables**:
- Enhanced Pine Script v7 with:
  - **Scenario 1** (keep existing): EMA10>EMA21 OR Price>EMA20 OR VWAP Bounce
  - **SMC/FVG/CHOCH** (add new):
    - Liquidity sweep detection
    - Fair value gap formation
    - Change of character on LTF (15min)
  - **Dual-strategy tagging**: Each alert includes `scenario='scenario_1'` or `scenario='smcfvg'`

**Dependencies**: None (independent from Capital.com work)

**Can Start**: Immediately (while capital-client.ts is being created)

**Timeline**:
- Day 1-2: Develop SMC detection logic (2 hours)
- Day 2-3: Test and refine (1 hour)
- Day 4: Deploy to TradingView (0.5 hours)
- Day 5: Paper trade both strategies simultaneously (1-2 hours)

**Deliverable Output**:
- Updated Pine Script file (ready to upload to TradingView)
- Test results showing both strategies firing alerts

---

### PARALLEL TRACK 2: Dashboard UI Strategy Filtering (3-4 hours)

**Goal**: Update trading dashboard to filter and compare both strategies side-by-side

**Deliverables**:
- **Strategy filter buttons**:
  - [Scenario 1] [SMC/FVG] [All] buttons
  - Default: [All] (show both)
  - Color coding: Blue = Scenario 1, Purple = SMC/FVG
  - Applied to: pending trades, open positions, alert history

- **Strategy-specific statistics**:
  - Left column: Scenario 1 (W/L count, win rate %, today's P&L)
  - Right column: SMC/FVG (W/L count, win rate %, today's P&L)
  - Comparison: "Scenario 1 (75% win) vs SMC (50% win)"
  - Auto-refresh every 30 seconds

- **Position strategy tagging**:
  - Each open position card shows: "Strategy: Scenario 1" or "Strategy: SMC/FVG"
  - Background color matches strategy (Blue/Purple)
  - Sort by strategy

**Dependencies**: Dashboard already exists, just enhance it

**Can Start**: Immediately (depends on schema updates, which are done ✅)

**Timeline**:
- Day 1-2: Add filter buttons and conditional rendering (1 hour)
- Day 3: Add strategy-specific stats display (1 hour)
- Day 4: Tag positions and add color coding (0.5 hours)
- Day 5: Test and verify filters work (0.5 hours)

**Deliverable Output**:
- Updated `src/app/dashboard/page.tsx` (enhanced UI)
- Strategy filtering working on live dashboard
- Side-by-side win-rate comparison visible

---

### PARALLEL TRACK 3: Backtesting Framework (5-6 hours)

**Goal**: Create infrastructure for collecting trade data and analyzing R:R ratios (for Week 3-4)

**Deliverables**:

1. **Trade Data Collection** (database schema):
   - ✅ `trades.strategy` (TEXT) — 'scenario_1' or 'smcfvg'
   - ✅ `trades.rr_ratio` (REAL) — Target ratio (2.0, 3.0, etc.)
   - ✅ `trades.participation_level` (TEXT) — 'standard', 'aggressive', 'conservative'
   - NEW: `trades.actual_rr_achieved` (REAL) — Actual ratio hit at exit
   - NEW: `trades.trade_type` (TEXT) — 'completed', 'stopped_out', 'partial_exit'
   - NEW: Timestamp columns for entry/exit candle times

2. **Trade Logger Utility** (`src/lib/trade-logger.ts`, ~150 lines):
   - `logTrade()` — Log complete trade with all metadata
   - `calculateActualRR()` — Compute actual R:R achieved
   - `extractStrategy()` — Auto-detect strategy from pending_trades
   - All timestamps in Adelaide timezone (HH:MM ADL)

3. **CSV Export Endpoint** (`src/app/api/backtest/export`, ~100 lines):
   - Query params: `?strategy=scenario_1&symbol=EURUSD&since=2026-05-15&until=2026-05-28`
   - Output: CSV with symbol, entry_time, exit_time, entry_price, exit_price, rr_target, actual_rr, win/loss
   - Used for external R:R analysis and Sharpe ratio calculations

4. **Dashboard Backtesting Section** (updated `src/app/dashboard/page.tsx`):
   - New UI section: "Backtesting Summary" (initially empty)
   - Shows: Sample size per strategy, win rates, expectancy
   - Charts ready for Week 3-4 data population
   - Not data-populated yet, but infrastructure ready

**Dependencies**: Database schema (done ✅), Capital.com integration (in progress)

**Can Start**: Immediately (database part is done, just add utilities)

**Timeline**:
- Day 1-2: Create trade logger utility (1.5 hours)
- Day 3: Create CSV export endpoint (1.5 hours)
- Day 4: Add dashboard section (0.5 hours)
- Day 5: Test export and verify data collection (1 hour)

**Deliverable Output**:
- Trade logging utility ready for use
- CSV export working (can test with sample data)
- Dashboard UI ready for Week 3-4 data
- Backtesting infrastructure complete

---

### PARALLEL TRACK 4: Testing & Documentation (5-6 hours)

**Goal**: Comprehensive testing and documentation for new features

**Deliverables**:

1. **E2E Test Script** (`scripts/e2e-trade-flow.ts`, ~200 lines):
   - Automated sequence: POST alert → pending queue → approve → execution
   - Verifies: API responses, database updates, ntfy alerts, Capital.com order
   - Runnable with: `npm run test:e2e`
   - Reports: PASS/FAIL for each step

2. **Unit Tests** (`src/__tests__/lib/capital-client.test.ts`, ~150 lines):
   - Test authenticate() — token generation, TTL refresh
   - Test executeOrder() — payload validation, epic mapping
   - Test all 4 instruments (EURUSD, XAUUSD, BTCUSD, AUDUSD)
   - Mock fetch() for safety (no real Capital.com calls)
   - Coverage: >85%

3. **Integration Tests** (`src/__tests__/api/pending.test.ts`, ~150 lines):
   - Test POST /api/alerts → pending_trades insert
   - Test GET /api/pending → list pending trades
   - Test POST /api/pending/{id}/approve → execution
   - Test POST /api/pending/{id}/reject → rejection
   - Database integration verified

4. **Documentation**:
   - `STRATEGY-SMC-GUIDE.md` (~400 words) — Complete SMC/FVG/CHOCH strategy guide
     - What is Smart Money Concepts?
     - Liquidity sweep definition
     - Fair value gap formation rules
     - Change of character confirmation
     - Entry/stop/TP rules
   - `BACKTEST-RR-GUIDE.md` (~300 words) — How to backtest R:R ratios
     - Data collection process
     - CSV export instructions
     - R:R definitions (1.5:1 through 10.0:1)
     - Expected outputs (win rate, expectancy, Sharpe)
     - Decision framework

**Dependencies**: Capital.com integration in progress (for integration tests)

**Can Start**: Immediately (unit tests can mock, documentation is independent)

**Timeline**:
- Day 1-2: Write E2E test script (1.5 hours)
- Day 2-3: Write unit tests (1.5 hours)
- Day 4: Write integration tests (1 hour)
- Day 5: Write documentation (1.5 hours)

**Deliverable Output**:
- E2E test script (automated validation)
- Unit & integration tests (85%+ coverage)
- Two comprehensive guides (SMC strategy + R:R backtesting)
- CI/CD ready (all tests pass before deploy)

---

## 🕐 Parallel Execution Timeline (Week of 22 May)

```
MON 22 May       TUE 23 May      WED 24 May      THU 25 May      FRI 26 May
─────────────────────────────────────────────────────────────────────────────

PRIMARY TRACK (Capital.com)
✅ capital-client.ts    Credentials     /api/{id}/approve   Full workflow    EOD COMPLETE
✅ db-migrations.ts     Deploy          update               test
✅ .env.template        test auth       Endpoint ready

PARALLEL 1 (Pine Script)
                SMC detect    FVG detect    CHOCH detect      Deploy           Paper trade
                logic (1h)    logic (1h)    logic (1h)        to TV (0.5h)     both (1-2h)
                ────────────────────────────────────────────────────────────
                        Development work (2 hours)            Testing (1-2 hours)

PARALLEL 2 (Dashboard)
                              Filter        Strategy          Position         Final test
                              buttons       stats             tagging          (0.5h)
                              (1h)          (1h)              (0.5h)
                              ──────────────────────────────────────────
                                      Development work (2.5 hours)

PARALLEL 3 (Backtesting)
                Trade         CSV export    Dashboard         Data collection  Verify export
                logger        endpoint      section           test             (1h)
                (1.5h)        (1.5h)        (0.5h)
                ──────────────────────────────────────────────────────────
                        Development work (3.5 hours)

PARALLEL 4 (Testing & Docs)
        E2E test  Unit tests   Integration   SMC guide         RR guide         DONE
        script    capital-     tests /api/   (400 words)       (300 words)
        (1.5h)    client.ts    pending       + implementation
                  (1.5h)       (1h)          guide update
                  ───────────────────────────────────────
                        Development work (4 hours)
```

---

## 📋 Completion Checklist (By EOD Friday 26 May)

### PRIMARY: Capital.com Integration ✅
- [x] capital-client.ts created with 6 methods
- [x] Database migrations created and ready
- [ ] .env.local configured with credentials
- [ ] Deployed to Vercel
- [ ] Capital.com authentication verified
- [ ] /api/pending/{id}/approve integrated
- [ ] Full workflow tested

### PARALLEL 1: Pine Script ⏳
- [ ] SMC liquidity sweep detection added
- [ ] Fair value gap detection added
- [ ] Change of character confirmation added
- [ ] Dual-strategy tagging implemented
- [ ] Deployed to TradingView
- [ ] Paper trading both strategies simultaneously

### PARALLEL 2: Dashboard UI ⏳
- [ ] Strategy filter buttons added
- [ ] Win-rate comparison display working
- [ ] Positions tagged with strategy
- [ ] Color coding implemented (Blue/Purple)
- [ ] Auto-refresh verified every 30 seconds

### PARALLEL 3: Backtesting Framework ⏳
- [x] Database schema ready (migrations done)
- [ ] Trade logger utility created
- [ ] CSV export endpoint working
- [ ] Dashboard backtesting section added (empty, ready)
- [ ] Data collection tested with sample trades

### PARALLEL 4: Testing & Documentation ⏳
- [ ] E2E test script created (runnable with `npm run test:e2e`)
- [ ] Unit tests for capital-client.ts (>85% coverage)
- [ ] Integration tests for /api/pending routes
- [ ] STRATEGY-SMC-GUIDE.md written
- [ ] BACKTEST-RR-GUIDE.md written

---

## 🎯 Expected Week 1 Output

By Friday EOD, you will have:

1. ✅ **Capital.com integration complete** → Trades execute after manual approval
2. 🎨 **Dashboard with strategy filtering** → See Scenario 1 vs SMC stats side-by-side
3. 🤖 **Pine Script dual-strategy detection** → Both signals live on TradingView chart
4. 📊 **Backtesting infrastructure ready** → Data collection set up for Week 3-4 analysis
5. 🧪 **Full test coverage** → E2E + unit + integration tests all passing
6. 📖 **Complete documentation** → SMC strategy guide + backtesting methodology

**No dependencies between tracks** → All 5 workstreams can run in parallel  
**No blocking issues** → Each track has clear, well-defined deliverables  
**Ready for Week 2** → Pine Script + Dashboard ready for live signal collection  

---

## 💡 Why Parallel Execution Works Here

✅ **Independent codebases**: 
- Pine Script (TradingView) ≠ Web app (Next.js)
- Dashboard UI ≠ Backend API ≠ Database

✅ **No cross-dependencies**:
- Pine Script doesn't need capital-client.ts
- Dashboard doesn't need SMC detection
- Backtesting framework doesn't need UI

✅ **Same deadline (Friday)**:
- All tracks end at same time
- No waiting between phases
- All features ship together

✅ **Different skill sets** (if team involved):
- Capital.com: Backend API integration
- Pine Script: Pine Script v7 logic
- Dashboard: React/TypeScript UI
- Backtesting: Data science/analysis
- Testing: QA/automation

---

## 📞 Support & Handoff

**For each track**, refer to:
- **Capital.com**: `WEEK1-START-TODAY.md` (step-by-step checklist)
- **Pine Script**: `STRATEGY-SMC-GUIDE.md` (detailed strategy rules + Pine code)
- **Dashboard**: Dashboard component updates (in `src/app/dashboard/page.tsx`)
- **Backtesting**: `BACKTEST-RR-GUIDE.md` (data collection methodology)
- **Testing**: Test file templates in `src/__tests__/`

**Questions?**:
- Capital.com auth fails → Check `.env.local` credentials
- Pine Script won't compile → Check TradingView Pine v7 syntax
- Dashboard filters not working → Check React state management
- Backtesting export empty → Confirm trades logged in database

---

## 🚀 Next Steps

**START TODAY (22 May, 14:35 ADL)**:
1. Follow `WEEK1-START-TODAY.md` checklist (2-3 hours for primary track)
2. In parallel, start on any of the 4 other tracks
3. Target: All 5 workstreams launched by EOD Monday

**By Friday (26 May)**:
- All primary deliverables complete
- All 4 parallel tracks finished
- Code deployed to Vercel
- Tests passing
- Ready for Week 2

---

Generated: 22 May 2026, 14:35 ADL  
Revised: Week 1 foundation complete, ready for parallel execution
