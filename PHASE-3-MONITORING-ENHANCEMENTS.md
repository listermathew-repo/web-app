# PHASE 3: TRADING SYSTEM MONITORING & OPTIMIZATION ENHANCEMENTS

**Branch**: `feat/trading-system-phase-3-monitoring`  
**Target**: Production deployment by June 1, 2026  
**Effort**: 8-12 hours (P1 & P2 tasks)  
**Priority**: P1 (critical), P2 (important)

---

## 📋 IMPLEMENTATION ROADMAP

### Phase 3A: Real-Time Monitoring (P1 — Critical)

#### Task 1: Advanced Health Check Endpoint
**File**: `src/app/api/health/route.ts` (enhance existing)  
**What**: Expand health checks beyond current basic status  
**Additions**:
- Trade execution latency (API response time)
- Capital.com connectivity check (dummy order rejection test)
- TradingView webhook responsiveness (timestamp check)
- Database query performance (50th/95th percentile)
- ntfy.sh delivery confirmation (test alert)
- System resources (memory usage, uptime)

**Expected Output**:
```json
{
  "status": "healthy",
  "checks": {
    "webhook": { "status": "ok", "latency": "42ms" },
    "database": { "status": "ok", "p95_query_time": "18ms" },
    "capital_com": { "status": "ok", "connectivity": "verified" },
    "tradingview": { "status": "ok", "last_alert": "2m ago" },
    "ntfy": { "status": "ok", "delivery_time": "850ms" },
    "system": { "memory": "42%", "uptime": "14 days" }
  }
}
```

#### Task 2: Trade Execution Monitoring Dashboard
**Files**: 
- `src/app/pulse/page.tsx` (enhance existing PulsePointDashboard)
- `src/lib/pulse-point-engine.ts` (add execution metrics)

**What**: Real-time visualization of:
- Trades in last 24 hours (count, P&L trend)
- Current open positions (symbol, entry, P&L, time open)
- Win/loss ratio (today, this week, this month)
- Average entry time (Stage 1 to Stage 5)
- Confluence score distribution (histogram of Stage 5 scores)
- Optimal time window analysis (setups by hour)

**Expected Widget**:
```
┌─────────────────────────────────────────┐
│ 📊 TRADING MONITOR — May 24, 2026       │
├─────────────────────────────────────────┤
│ Today: 2 trades | 1W (+$850) | 1L (-$350) │
│ This Month: 18W-7L | 72% win rate | +$18,240 P&L │
│                                         │
│ Open Positions (1):                     │
│  AUDUSD LONG @ 0.71281 +$280 | +0.39%   │
│                                         │
│ Avg Entry Time: 58 min (Stage 1→5)      │
│ Peak Window: 12:30-14:00 ADL (8/12 setups) │
└─────────────────────────────────────────┘
```

#### Task 3: Slack/Discord Webhook Integration
**Files**: `src/lib/alerts.ts` (add new function)  
**What**: Route critical alerts to Slack/Discord for team visibility

**Implementation**:
```typescript
async function sendSlackAlert(
  type: 'success' | 'error' | 'warning',
  title: string,
  details: Record<string, any>
) {
  const color = type === 'error' ? 'danger' : 'good';
  const payload = {
    channel: '#trading-alerts',
    attachments: [{
      color,
      title,
      fields: Object.entries(details).map(([k, v]) => ({
        title: k,
        value: v,
        short: true
      }))
    }]
  };
  
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
```

**Trigger Events**:
- ✅ Trade executed → "Trade #42: AUDUSD LONG @ 0.71281"
- ❌ Trade stopped out → "Loss: -$350 on AUDUSD #42"
- ❌ Daily loss exceeds $1,050 → "TRADING HALTED: Daily loss $1,260"
- ⚠️ Webhook latency >2 sec → "Slow webhook: 3,200ms response"

---

### Phase 3B: Position Tracking Optimization (P1)

#### Task 4: Real-Time Position Sync
**Files**: `src/lib/capital-client.ts` (enhance existing)  
**What**: Periodically fetch open positions from Capital.com API

**Implementation**:
```typescript
class PositionTracker {
  async syncOpenPositions() {
    const positions = await capitalClient.getOpenPositions();
    const dbPositions = positions.map(p => ({
      deal_id: p.dealId,
      symbol: p.symbol,
      direction: p.direction,
      entry_price: p.entryPrice,
      current_price: p.currentPrice,
      size: p.size,
      pnl: p.profitLoss,
      open_time: p.openTime,
      last_sync: new Date()
    }));
    
    await db.transaction(() => {
      db.exec('DELETE FROM open_positions');
      db.exec('INSERT INTO open_positions VALUES...', dbPositions);
    });
    
    return dbPositions;
  }
}
```

**Database Table** (`open_positions`):
```sql
CREATE TABLE open_positions (
  id TEXT PRIMARY KEY,
  deal_id TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL,
  size REAL,
  pnl INTEGER,
  open_time TIMESTAMP,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Task 5: Position Dashboard Widget
**Files**: `src/components/PositionMonitor.tsx` (new)  
**What**: Live position P&L tracker

**Expected Display**:
```
┌────────────────────────────────────────┐
│ OPEN POSITIONS                         │
├────────────────────────────────────────┤
│ #1 AUDUSD LONG @ 0.71281               │
│    Entry: 12:35 ADL | Open: 27 min     │
│    Current: 0.71320 | P&L: +$280 (+5%) │
│    Size: 10 micro lots | Risk: $350    │
│                                        │
│ EXPOSURE: $350 (1.2% of account)      │
│ MAX LOSS TO SL: $350 | ROOM TO TGT: $1,680 │
└────────────────────────────────────────┘
```

---

### Phase 3C: Execution Optimization (P2)

#### Task 6: Confluence Score Auto-Adjustment
**Files**: `src/lib/rule-validator.ts` (enhance)  
**What**: Dynamic confluence thresholds based on market regime

**Logic**:
```
Normal market (ATR average): Confluence 70-75-80-85
Trending market (ATR +50%): Confluence 65-70-75-80 (lower bar)
Choppy market (ATR -50%): Confluence 75-80-85-90 (higher bar)
```

**Implementation**:
```typescript
function calculateDynamicConfluence(
  marketRegime: 'normal' | 'trending' | 'choppy'
): Record<string, number> {
  const baseThresholds = {
    stage1: 70, stage2: 75, stage3: 75, stage4: 80, stage5: 85
  };
  
  if (marketRegime === 'trending') {
    return { ...baseThresholds, stage1: 65, stage2: 70, stage5: 80 };
  }
  if (marketRegime === 'choppy') {
    return { ...baseThresholds, stage1: 75, stage2: 80, stage5: 90 };
  }
  
  return baseThresholds;
}
```

#### Task 7: Stage 5 Trigger Optimization
**Files**: `src/lib/advanced-pulse-engine.ts` (enhance)  
**What**: Tighten Stage 5 accuracy based on confluence distribution

**Optimizations**:
- Only fire Stage 5 if confluence is 85%+ AND 2M/1M candle closes above setup zone
- Add volume confirmation: volume on Stage 5 candle > previous 5 bars average
- Add reversal filter: don't trigger if previous candle is high-wick rejection
- Add liquidity check: don't trigger if spread > 2 pips

**Expected improvement**: Stage 5 accuracy from 90-98% → 94-99%

---

### Phase 3D: Data & Analytics (P2)

#### Task 8: Trade Statistics API
**Files**: `src/app/api/stats/route.ts` (new)  
**What**: Query endpoint for trading analytics

**Endpoints**:
```
GET /api/stats?period=day|week|month
  → { trades: 18, winners: 11, losers: 7, winRate: 61%, pnl: $18240 }

GET /api/stats/window?window=12:30-17:30
  → { avgSetups: 2.4, avgEntryTime: 57min, profitableWindows: 18/22 }

GET /api/stats/instrument?symbol=AUDUSD
  → { trades: 42, winRate: 62%, rr: 4.8, bestTime: '12:30-14:00' }
```

#### Task 9: Backtesting Export Enhancement
**Files**: `src/app/api/backtest/export/route.ts` (enhance)  
**What**: Export trade history + analysis to multiple formats

**Formats**:
- ✅ Excel (pivot tables by instrument/window/hour)
- ✅ CSV (raw trade data)
- 🔄 JSON (for dashboards)
- 🔄 PDF (monthly performance report)

---

### Phase 3E: Reliability (P2)

#### Task 10: Duplicate Trade Prevention (Rate Limiting)
**Files**: `src/lib/rate-limiter.ts` (enhance)  
**What**: Prevent double-triggers within 60 seconds

**Implementation**:
```typescript
const rateLimiter = new RateLimiter();

// In webhook handler
if (rateLimiter.isLimited('AUDUSD:LONG')) {
  return Response.json(
    { error: 'Duplicate detected within 60s', status: 429 },
    { status: 429 }
  );
}

rateLimiter.record('AUDUSD:LONG');
```

#### Task 11: E2E Monitoring Script
**Files**: `scripts/e2e-monitoring.sh` (new)  
**What**: Automated system health checks every 15 minutes

**Checks**:
- [ ] Webhook responds in < 2 sec
- [ ] Database query < 100ms (50th percentile)
- [ ] Capital.com API responsive
- [ ] TradingView receiving alerts
- [ ] ntfy.sh delivering messages
- [ ] Memory usage < 80%

**Action on failure**: Send alert via Slack + ntfy

#### Task 12: Weekly Performance Report
**Files**: `scripts/weekly-report-generator.ts` (new)  
**What**: Auto-generate weekly trading summary PDF

**Contents**:
- Trade count by instrument
- Win/loss ratio and P&L by day
- Best/worst trades with chart
- Optimal window analysis
- Confluence score trends
- Recommendations for next week

**Delivered**: Every Sunday 19:00 ADL via email

---

## 📊 TESTING PLAN

### Unit Tests
- [ ] Health check endpoint returns all metrics
- [ ] Position tracker sync matches Capital.com API
- [ ] Rate limiter prevents duplicates correctly
- [ ] Dynamic confluence adjusts thresholds properly
- [ ] Statistics API calculates win rate correctly

### Integration Tests
- [ ] Webhook → Database → Position tracker → Dashboard (end-to-end)
- [ ] Trade execution → Alert notification → Slack/Discord
- [ ] Failed Capital.com call → Fallback to cached positions
- [ ] E2E monitor detects and alerts on failures

### Load Tests
- [ ] 100 trades/day → Dashboard still responsive (<500ms)
- [ ] Health check endpoint handles 10 req/sec
- [ ] Position tracker syncs 50+ positions in <2 sec

---

## 📈 EXPECTED IMPACT

| Enhancement | Current | Target | Improvement |
|-------------|---------|--------|---|
| Webhook latency | 200ms | <100ms | 2x faster |
| Stage 5 accuracy | 92-98% | 94-99% | +2% accuracy |
| Trade execution time | 58 min avg | 55 min | -3 min |
| False positives | 8% | <4% | -50% |
| System uptime | 99.5% | 99.95% | -2hr downtime/month |

**Expected result**: +$1,200/month additional profit from optimizations + zero missed trades due to system downtime

---

## 🚀 DEPLOYMENT PLAN

### Step 1: Implement & Test (3 days)
- [ ] Code all 12 tasks in parallel branches
- [ ] Unit tests passing for each
- [ ] Integration tests passing
- [ ] Code review passed

### Step 2: Staging Validation (1 day)
- [ ] Deploy to Vercel staging environment
- [ ] Run E2E tests against staging
- [ ] Verify Slack/Discord integration
- [ ] Load test with 100 trades/day simulation

### Step 3: Production Rollout (1 day)
- [ ] Merge to main (squash commits)
- [ ] Deploy to production
- [ ] Monitor health checks for 24 hours
- [ ] Verify no regression in trade execution

### Step 4: Go-Live (May 31, 2026)
- [ ] Launch live trading with Phase 3 enhancements
- [ ] Begin daily monitoring + weekly reports
- [ ] First month of optimized execution

---

## 💾 COMMIT STRUCTURE

```
feat: Add Phase 3 trading system monitoring & optimization

- Task 1: Advanced health check endpoint with latency metrics
- Task 2: Trade execution monitoring dashboard widget
- Task 3: Slack/Discord webhook integration for critical alerts
- Task 4: Real-time position synchronization from Capital.com
- Task 5: Live position P&L monitoring dashboard
- Task 6: Dynamic confluence score adjustment by market regime
- Task 7: Stage 5 trigger optimization (volume + reversal filters)
- Task 8: Trade statistics API (period/window/instrument queries)
- Task 9: Backtesting export enhancements (JSON, PDF formats)
- Task 10: Rate limiting for duplicate trade prevention
- Task 11: Automated E2E monitoring script (15-min checks)
- Task 12: Weekly performance report generator

Tests: ✅ Unit, integration, and load tests added
Docs: ✅ Inline comments + API documentation
Impact: +$1,200/month from optimization + zero system downtime

Closes #TBD (Trading System Phase 3)
```

---

## 📅 TIMELINE

| Date | Milestone | Status |
|------|-----------|--------|
| May 25 | Begin 12:30 ADL trading (Phase 1+2) | 🟢 Ready |
| May 28 | Phase 3 development starts | ⏳ Scheduled |
| May 31 | Phase 3 staging deployment | ⏳ Scheduled |
| June 1 | Phase 3 production launch | ⏳ Scheduled |
| June 30 | Full optimization + dual-window trading | ⏳ Scheduled |

---

**Status**: Planning phase complete  
**Effort Remaining**: 8-12 hours development  
**Ready to Begin**: May 28, 2026  
**Expected Completion**: May 31, 2026

