# Trading System Architecture
## Complete System Design & Week 1 Implementation

**Last Updated**: 22 May 2026, 14:35 ADL  
**Status**: Week 1 Foundation Complete — Ready for Parallel Execution  
**Timeline**: 4-week implementation (22 May - 18 June 2026)

---

## 🎯 System Overview

A comprehensive manual-approval trading system for 4 currency pairs and commodities:
- **EURUSD** — Major forex pair (40 pips stop, $400 risk)
- **XAUUSD** — Gold/precious metals ($4534.74 stop, $400 risk)
- **BTCUSD** — Bitcoin cryptocurrency (77155 stop, $400 risk)
- **AUDUSD** — Australian Dollar (0.7110 stop, $400 risk)

**Strategies** (to run in parallel):
1. **Scenario 1 (Swing Break)**: EMA10>EMA21 OR Price>EMA20 OR VWAP Bounce
2. **SMC/FVG/CHOCH** (Week 2): Liquidity sweep → FVG → LTF change of character

**Approval Model**: Manual (user reviews signals before Capital.com execution)

**Risk Management**: $400/trade, max 3 daily losses, $1,200/day max loss

---

## 🏗️ Architecture Layers

### Layer 1: Signal Generation (TradingView)
```
Pine Script v7 (Dual-Strategy)
├─ Scenario 1 Detection (working)
│  ├─ Condition C4: Price > EMA20
│  ├─ Condition C3: EMA10 > EMA21
│  └─ Condition C1: VWAP Bounce
├─ SMC/FVG/CHOCH Detection (Week 2)
│  ├─ Liquidity Sweep
│  ├─ Fair Value Gap
│  └─ LTF Change of Character
└─ Alert Webhook
   └─ POST /api/alerts with scenario tag
```

### Layer 2: Alert Reception & Validation
```
POST /api/alerts (Webhook Endpoint)
├─ Authentication: X-API-Key header validation
├─ Schema Validation: Zod (symbol, direction, entry, stop)
├─ Duplicate Prevention: 30-second rate limiting
├─ Trade Validation: 10-point entry checklist
│  ├─ 1. Time (09:00-22:00 ADL)
│  ├─ 2. Alert verified
│  ├─ 3. Price action confirmed
│  ├─ 4. Stop loss validated
│  ├─ 5. Take profit confirmed (1.5x-2.5x RRR)
│  ├─ 6. Capital.com API ready
│  ├─ 7. Risk management rules
│  ├─ 8. Approval workflow (expires in 5 min)
│  ├─ 9. Chart confirmation
│  └─ 10. Approval decision
└─ Database: Insert into pending_trades with status='pending'
```

### Layer 3: Approval Queue (User Interaction)
```
Dashboard (/dashboard)
├─ Pending Trades Section (Yellow Cards)
│  ├─ Symbol & Direction badge
│  ├─ Entry level & Stop loss
│  ├─ Risk & Risk-Reward ratio
│  ├─ Expiration countdown (5 min)
│  ├─ APPROVE button (green)
│  └─ REJECT button (red)
├─ Daily Stats Card
│  ├─ Total trades today
│  ├─ Winners/losers count
│  ├─ Win rate %
│  └─ Daily P&L (color coded)
├─ Open Positions (Green/Red Cards)
│  ├─ Current P&L in USD
│  ├─ Entry/current/stop prices
│  └─ Strategy origin tag
└─ Alert History Table (Last 10)
   ├─ Timestamp (HH:MM ADL format)
   ├─ Symbol & Level (TRIGGERED/WARNING/OK)
   ├─ Message & Priority
   └─ Color badges (red/yellow/green)
```

### Layer 4: Order Execution (Capital.com)
```
POST /api/pending/{id}/approve
├─ Get pending trade from database
├─ Validate expiration (must be < 5 min old)
├─ Call Capital.com API
│  ├─ executeOrder()
│  ├─ Epic mapping (EURUSD→CS.D.EURUSD.MINI.IP, etc.)
│  ├─ Market order with stop loss
│  └─ Return deal_reference
├─ Database updates
│  ├─ Update pending_trades: status='approved'
│  ├─ Insert into trades: status='executed'
│  └─ Log deal_reference
└─ Alerts
   ├─ ntfy.sh: "✅ EXECUTED: EURUSD BUY @ 1.16353 | Deal: [ref]"
   ├─ SMS (Twilio): Backup alert if ntfy fails
   └─ Discord: Secondary notification channel
```

### Layer 5: Position Monitoring
```
5-Minute Monitoring Loop (During 09:00-22:00 ADL)
├─ Get current positions from Capital.com
├─ Compare current price to stop loss
├─ Status classification
│  ├─ 🟢 SAFE: Price > Stop Loss (>5 pips margin)
│  ├─ 🟡 CRITICAL: Price within 5 pips of stop
│  └─ 🔴 BREACHED: Price < Stop Loss (EXIT SIGNAL)
├─ Log to database (alert_log table)
└─ Send alerts
   ├─ SAFE: No alert needed
   ├─ CRITICAL: Yellow warning, "Monitor every tick"
   └─ BREACHED: URGENT red alert, "EXIT IMMEDIATELY"
```

### Layer 6: Data Analysis (Week 3-4)
```
Backtesting Framework
├─ Trade Data Collection
│  ├─ trades.strategy: 'scenario_1' or 'smcfvg'
│  ├─ trades.rr_ratio: Target ratio (2.0, 3.0, 5.0, etc.)
│  ├─ trades.actual_rr_achieved: Actual ratio at exit
│  └─ trades.trade_type: 'completed', 'stopped_out', 'partial'
├─ CSV Export (/api/backtest/export)
│  └─ Download trade data for R:R analysis
├─ R:R Optimization
│  ├─ Test all ratios: 1.5:1 through 10.0:1
│  ├─ Calculate: Win rate, expectancy, Sharpe ratio
│  ├─ Run Monte Carlo: 10,000 iterations
│  └─ Identify sweet spot per strategy/instrument
└─ Dashboard Results
   └─ Display optimal R:R ratios & instrument pairings
```

---

## 📊 Database Schema

### pending_trades (Approval Queue)
```sql
CREATE TABLE pending_trades (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,           -- EURUSD, XAUUSD, BTCUSD, AUDUSD
  direction TEXT NOT NULL,        -- 'long' or 'short'
  entry_level REAL NOT NULL,
  stop_level REAL NOT NULL,
  retap_level REAL,
  risk_amount INTEGER,            -- usually 400 USD
  scenario TEXT,                  -- 'scenario_1' or 'smcfvg'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,            -- auto-expires 5 min after creation
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected, executed
  approved_at DATETIME,
  approved_by TEXT DEFAULT 'manual',
  execution_price REAL,
  deal_reference TEXT,
  error_message TEXT
);
```

### trades (Execution History)
```sql
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price REAL NOT NULL,
  stop_price REAL NOT NULL,
  strategy TEXT DEFAULT 'scenario_1',      -- NEW: strategy tracking
  rr_ratio REAL DEFAULT 2.0,               -- NEW: target R:R ratio
  participation_level TEXT DEFAULT 'standard',  -- NEW: aggression level
  actual_rr_achieved REAL,                 -- NEW: actual ratio at exit
  trade_type TEXT,                         -- NEW: completed/stopped_out/partial
  size REAL,                               -- position size in lots
  risk_amount INTEGER,
  deal_reference TEXT,
  status TEXT,                  -- pending, approved, filled, failed, exited
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  executed_at DATETIME,
  exited_at DATETIME,
  exit_price REAL,
  pnl INTEGER,                  -- profit/loss in USD
  message TEXT,
  error_message TEXT
);
```

### rr_analysis (Backtesting Results)
```sql
CREATE TABLE rr_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy TEXT NOT NULL,                  -- 'scenario_1' or 'smcfvg'
  symbol TEXT NOT NULL,
  rr_ratio REAL NOT NULL,                  -- tested ratio (1.5, 2.0, 3.0, etc.)
  sample_size INTEGER DEFAULT 0,           -- number of trades in sample
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0.0,               -- percentage (0-100)
  avg_win REAL DEFAULT 0.0,
  avg_loss REAL DEFAULT 0.0,
  expectancy REAL DEFAULT 0.0,             -- (win_rate * avg_win) - (1-win_rate) * avg_loss
  sharpe_ratio REAL,
  sortino_ratio REAL,
  max_drawdown REAL,
  profit_factor REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(strategy, symbol, rr_ratio)
);
```

### backtest_results (Monte Carlo Simulation Data)
```sql
CREATE TABLE backtest_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_run_id TEXT NOT NULL,
  strategy TEXT NOT NULL,
  symbol TEXT NOT NULL,
  rr_ratio REAL NOT NULL,
  iteration INTEGER,                      -- simulation iteration number
  sequence_start INTEGER,
  sequence_end INTEGER,
  trades_in_sequence INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  total_return REAL,
  max_drawdown REAL,
  sharpe_ratio REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### alert_log (Historical Monitoring)
```sql
CREATE TABLE alert_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  level TEXT NOT NULL,           -- 'breakout', 'retap', 'stop', 'triggered', 'warning', 'ok'
  price REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### system_health (Component Status)
```sql
CREATE TABLE system_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  component TEXT NOT NULL,       -- 'webhook', 'database', 'capital_com', 'ntfy'
  status TEXT NOT NULL,          -- 'ok', 'warning', 'error'
  message TEXT,
  last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
  error_count INTEGER DEFAULT 0
);
```

---

## 🔌 API Endpoints

### Alert Reception
```
POST /api/alerts
├─ Input: X-API-Key header + JSON body
├─ Validation: Zod schema + 10-point checklist
├─ Response: 202 Accepted with trade_id
├─ Failure: 400/401/429 with error reason
└─ Side effects: Inserts pending_trades, sends ntfy notification
```

### Approval Workflow
```
GET /api/pending
└─ Returns: Array of pending trades (status='pending', not expired)

POST /api/pending/{id}/approve
├─ Input: Trade ID
├─ Process: Execute on Capital.com, update status
├─ Response: 200 with deal_reference
└─ Side effects: Inserts trades, updates pending_trades, sends success alert

POST /api/pending/{id}/reject
├─ Input: Trade ID
├─ Process: Mark as rejected
├─ Response: 200
└─ Side effects: Updates pending_trades, sends rejection alert
```

### Position Tracking
```
GET /api/positions
└─ Returns: Array of open positions from Capital.com
   ├─ symbol, direction, entry_price, current_price, stop_price
   ├─ profitLoss (USD), profitLossPercent
   └─ All positions with status NOT IN ('exited', 'closed')

POST /api/positions/{dealId}/close
└─ Close specific position via Capital.com API
```

### Monitoring
```
GET /api/health
└─ Returns: System health check
   ├─ Webhook status
   ├─ Database status
   ├─ Capital.com API status
   ├─ ntfy.sh connectivity
   └─ Last webhook received, last trade executed

GET /api/alerts/history?limit=10&since=2026-05-20
└─ Returns: Recent alerts from alert_log table
   ├─ Last 10 by default
   ├─ Filterable by date range, symbol, level
   └─ Used by dashboard alert history table
```

### Backtesting
```
GET /api/backtest/export?strategy=scenario_1&symbol=EURUSD&since=2026-05-15
└─ Returns: CSV export of completed trades
   ├─ Columns: symbol, entry_time, exit_time, entry_price, exit_price
   ├─ rr_target, actual_rr, win/loss
   └─ Used for R:R analysis in spreadsheets/Python
```

---

## 🔐 Security & Authentication

### API Key Protection
- **Webhook**: X-API-Key header validation (32-char random string)
- **Capital.com**: Email/password authentication (stored in .env.local)
- **Database**: SQLite (file-based, no network exposure)
- **.env.local**: NEVER committed to git (in .gitignore)

### Risk Safeguards
- **Paper Trading**: SIMULATE_TRADES=true (disable real execution during testing)
- **DEMO Mode**: CAPITAL_DEMO_MODE=true (trades execute on demo account)
- **Expiration**: Pending trades auto-expire in 5 minutes
- **Rate Limiting**: 30-second duplicate prevention
- **Trading Hours**: 09:00-22:00 ADL only (outside hours, trades rejected)
- **Daily Loss Limit**: Max 3 losing trades, $1,200 max loss per day

---

## 📡 Alert Redundancy (Multi-Channel)

### Primary Channel: ntfy.sh
```
POST https://ntfy.sh/mgm-7k4x-live
├─ Title: 🔴 SYMBOL or ✅ SYMBOL
├─ Priority: 5 (URGENT) for critical, 3 (NORMAL) for info
├─ Tags: trading, alert, scenario_1 or smcfvg
└─ Body: Full trade details + action required
```

### Backup Channel 1: Twilio SMS (Optional)
```
Triggered when: ntfy.sh fails OR high-priority alert
Recipient: USER_PHONE_NUMBER from .env.local
Message: "[SYMBOL] ALERT: Price [current] vs Stop [stop]. [ACTION]"
```

### Backup Channel 2: Discord Webhook (Optional)
```
POST DISCORD_WEBHOOK_URL (from .env.local)
├─ Content: Embedded message with color coding
│  ├─ Red (critical): Price at stop loss
│  ├─ Yellow (warning): Price near stop
│  └─ Green (safe): Position holding
└─ Fields: Symbol, current price, stop loss, distance, action
```

### Escalation: 5-Minute Timer
```
If stop loss triggered AND no response for 5 minutes:
├─ Re-send URGENT ntfy alert
├─ Send SMS reminder
├─ Send Discord escalation
└─ Mark as escalated in database
```

---

## 🔄 Data Flow Diagram

```
TradingView Pine Script v7
    │
    ├─ Scenario 1 Detection ──────────┐
    │  (EMA + VWAP + Price)            │
    │                                  │
    └─ SMC/FVG/CHOCH Detection ──────┤
       (Liquidity + Gap + CHOCH)       │
                                       ▼
                              POST /api/alerts
                                  (webhook)
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            Validate           10-Point           Rate Limit
            X-API-Key          Checklist          30 seconds
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                                       ▼
                            Insert: pending_trades
                           (status='pending')
                                       │
                          Send: ntfy.sh alert
                                       │
                                       ▼
                            Dashboard shows:
                          🟡 Pending Trade Card
                              (Countdown timer)
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
              [APPROVE]                             [REJECT]
                    │                                     │
                    ▼                                     ▼
         executeOrder()                    Update status='rejected'
         Capital.com                       Send rejection alert
         Market order
         with stop loss
                    │
                    ▼
         Update: status='executed'
         Insert: trades table
         Add: deal_reference
                    │
                    ▼
            Dashboard shows:
         📈 Open Position Card
            (Green if winning, Red if losing)
                    │
                    ▼
         5-Minute Monitoring Loop
         Compare price to stop loss
            │
   ┌────────┼────────┐
   │        │        │
  🟢 SAFE  🟡 CRIT   🔴 BREACH
   │        │        │
   └────────┼────────┘
            │
            ▼
       Send alert if needed
       Log to alert_log
       Update dashboard
```

---

## 📅 Implementation Timeline

### Week 1 (22-28 May) — Foundation Complete ✅
- [x] Capital.com API client (src/lib/capital-client.ts)
- [x] Database schema with migrations (src/lib/db-migrations.ts)
- [x] Configuration template (.env.template)
- [ ] Capital.com integration with /api/pending/{id}/approve
- [ ] Full workflow testing (alert → pending → approve → execution)

**Parallel Tracks**:
- [ ] Pine Script v7 dual-strategy detection
- [ ] Dashboard UI strategy filtering
- [ ] Backtesting framework setup
- [ ] Testing & documentation

### Week 2 (29 May - 4 June) — Strategy Enhancement
- [ ] Deploy SMC/FVG/CHOCH Pine Script
- [ ] Paper trade both strategies simultaneously
- [ ] Dashboard shows strategy-specific win rates
- [ ] Initial signal collection begins

### Week 3 (5 Jun - 11 Jun) — Data Collection
- [ ] Collect 50+ trades from Scenario 1
- [ ] Collect 50+ trades from SMC/FVG/CHOCH
- [ ] Log all trades with entry, exit, R:R achieved

### Week 4 (12 Jun - 18 Jun) — R:R Optimization
- [ ] Backtest all R:R ratios (1.5:1 through 10.0:1)
- [ ] Run Monte Carlo simulations (10,000 iterations)
- [ ] Calculate Sharpe/Sortino ratios
- [ ] Identify optimal R:R + instrument combos
- [ ] Decision: Which strategies/instruments to scale

### Week 5+ — Live Trading
- [ ] Enable LIVE trading (CAPITAL_DEMO_MODE=false)
- [ ] Scale lot sizes based on account performance
- [ ] Maintain manual approval workflow
- [ ] Monitor live results vs backtesting predictions

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Signal Generation** | Pine Script v7 | TradingView strategy detection |
| **Backend** | Next.js 16 (App Router) | API endpoints, dashboard |
| **Language** | TypeScript | Type safety |
| **Database** | SQLite (better-sqlite3) | Serverless-friendly, Vercel compatible |
| **Validation** | Zod | Runtime schema validation |
| **Styling** | Tailwind CSS | Dashboard UI |
| **Testing** | Vitest | Unit & integration tests |
| **Deployment** | Vercel | Serverless hosting |
| **Alert System** | ntfy.sh | Primary notifications |
| **SMS Backup** | Twilio | SMS alerts (optional) |
| **Chat Backup** | Discord | Webhook alerts (optional) |
| **Exchange API** | Capital.com REST | Order execution |

---

## 📋 Files & Directory Structure

```
web-app/
├── src/
│   ├── lib/
│   │   ├── capital-client.ts           (NEW - Capital.com API wrapper)
│   │   ├── db-migrations.ts            (NEW - schema upgrades)
│   │   ├── db.ts                       (UPDATED - auto-run migrations)
│   │   ├── alerts.ts                   (ntfy.sh alerts)
│   │   ├── alerts-redundancy.ts        (SMS/Discord backup)
│   │   └── trade-validator.ts          (10-point checklist)
│   ├── app/
│   │   ├── api/
│   │   │   ├── alerts/route.ts         (POST webhook)
│   │   │   ├── pending/route.ts        (GET list)
│   │   │   ├── pending/[id]/
│   │   │   │   ├── approve/route.ts    (POST execute)
│   │   │   │   └── reject/route.ts     (POST reject)
│   │   │   ├── positions/route.ts      (GET positions)
│   │   │   ├── health/route.ts         (GET health)
│   │   │   ├── alerts/history/route.ts (GET history)
│   │   │   └── backtest/export/route.ts(GET CSV)
│   │   └── dashboard/
│   │       └── page.tsx                (Dashboard UI)
│   └── __tests__/
│       └── api/
│           ├── alerts.test.ts
│           ├── pending.test.ts
│           └── positions.test.ts
├── .env.local                          (Credentials - NOT committed)
├── .env.template                       (NEW - Config template)
├── IMPLEMENTATION_GUIDE.md             (Scenario 1 + status definitions)
├── ARCHITECTURE.md                     (THIS FILE - System design)
├── WEEK1-PARALLEL-TASKS.md            (NEW - 5 workstreams)
├── WEEK1-START-TODAY.md               (NEW - Step-by-step checklist)
├── PARALLEL-WORKSTREAMS-SUMMARY.md    (NEW - Executive summary)
├── STRATEGY-SMC-GUIDE.md              (NEW - SMC strategy details)
├── BACKTEST-RR-GUIDE.md               (NEW - Backtesting methodology)
├── package.json                        (Dependencies)
├── tsconfig.json                       (TypeScript config)
├── next.config.ts                      (Next.js config)
└── .db/
    └── trading.db                      (SQLite database)
```

---

## 🧪 Testing Strategy

### Unit Tests
- capital-client.ts: Authentication, epic mapping, order execution
- trade-validator.ts: 10-point checklist validation
- db-migrations.ts: Schema migration idempotence

### Integration Tests
- POST /api/alerts → pending_trades insert
- GET /api/pending → list pending trades
- POST /api/pending/{id}/approve → Capital.com execution
- POST /api/pending/{id}/reject → rejection workflow

### E2E Tests
- Full flow: Alert → Pending → Approval → Execution → Position tracking
- All 4 instruments tested
- Both strategies tested

### Load Tests
- 100+ pending trades in queue
- 5-minute polling every second (overload test)
- Dashboard with 1000+ rows of alert history

---

## 📊 Monitoring & Observability

### Dashboard Metrics
- Daily stats: Total trades, winners, losers, P&L, win rate %
- Pending trades: Count, expiration countdown
- Open positions: Current P&L, drawdown to stop
- Alert history: Last 10 alerts, severity levels

### Database Logging
- alert_log: All price monitoring events
- system_health: Component status checks
- trades: Complete trade history with timestamps

### External Monitoring
- ntfy.sh: Real-time alerts to phone
- SMS (optional): Critical alerts
- Discord (optional): Team notifications

---

## 🔍 Compliance & Risk Management

### Trading Hours
- System only processes alerts: 09:00-22:00 ADL
- Outside hours: Trades rejected with reason "Outside trading hours"
- Monitoring continues during trading hours only

### Position Limits
- Max 3 concurrent positions (per rules)
- Max 3 daily losses
- Max $1,200 daily loss
- Each trade: $400 fixed risk

### Stop Loss Rules
- **EURUSD**: 1.1617 (40 pips from entry ~1.1657)
- **XAUUSD**: 4534.74 (tight stop for volatility)
- **BTCUSD**: 77155 (tight stop for leverage)
- **AUDUSD**: 0.7110 (30 pips from entry ~0.7140)

### Escalation Procedure
1. Stop loss triggered → 🔴 BREACHED alert (5 min escalation timer)
2. If no response in 5 min → Repeat alert (all channels)
3. Manual intervention recommended
4. Close position via /api/positions/{dealId}/close

---

## 🎓 Key Concepts

### Scenario 1 (Swing Break)
Entry when ANY of these are true:
- **C4**: Price closes above 20-period EMA
- **C3**: 10-period EMA crosses above 21-period EMA (golden cross)
- **C1**: Price bounces off VWAP (volume-weighted average price)

Confirmation:
- Full body close above/below level (no wicks back)
- Impulsive candle (engagement on move)
- Volume increasing into breakout direction

### SMC/FVG/CHOCH (Week 2)
Smart Money Concepts strategy combining:
1. **Liquidity Sweep**: Price breaks recent swing low/high, retraces 50-80%
2. **Fair Value Gap**: Gap between candle wicks, untouched by subsequent bars
3. **Change of Character**: Break of previous swing on LTF (15min), return, then entry

### R:R Optimization (Week 3-4)
Testing all risk-reward ratios from 1.5:1 to 10.0:1:
- **1.5:1**: Frequent wins, low payoff (low participation)
- **3.0:1**: Sweet spot for many strategies
- **5.0:1**: Higher win rate required, higher payoff
- **10.0:1**: Rare wins, massive payoff, high participation

Calculate expectancy: (Win% × AvgWin) - (Loss% × AvgLoss)

---

## 📝 Timezone Standards (CRITICAL)

**ALL timestamps in system use Adelaide local time format: "HH:MM ADL"**

Examples:
- ✅ "09:30 ADL" — morning trading start
- ✅ "14:45 ADL" — mid-afternoon
- ✅ "22:15 ADL" — evening close
- ❌ NEVER: "Yesterday at 14:41 UTC"
- ❌ NEVER: "UTC+9:30"
- ❌ NEVER: timestamps without "ADL" zone marker

Applied to:
- Database: All DATETIME columns store Adelaide times
- Logs: All timestamps include "HH:MM ADL"
- Alerts: ntfy/SMS/Discord include "HH:MM ADL" in messages
- API responses: JSON timestamps marked with ADL timezone
- Documentation: All examples use "HH:MM ADL" format

Reference: https://time.is/Adelaide

---

## 🚀 Getting Started

1. **Clone & Setup**:
   ```bash
   cd C:\Users\mathe\web-app
   npm install
   cp .env.template .env.local
   ```

2. **Configure Credentials** (see WEEK1-START-TODAY.md):
   ```
   CAPITAL_COM_EMAIL=your_email@example.com
   CAPITAL_COM_PASSWORD=your_password
   CAPITAL_DEMO_MODE=true
   WEBHOOK_API_KEY=your_32_char_key
   ```

3. **Initialize Database**:
   ```bash
   npm run build
   # Database auto-initializes on first app load
   ```

4. **Test Capital.com Connection**:
   ```bash
   npx ts-node scripts/test-capital.ts
   ```

5. **Deploy to Vercel**:
   ```bash
   git push origin main
   ```

6. **Start Trading**:
   - Open dashboard at `/dashboard`
   - TradingView sends alerts → webhook → pending queue
   - Review signals → Click APPROVE → Capital.com executes
   - Monitor positions in dashboard

---

## 📞 Support & Documentation

- **Implementation**: WEEK1-START-TODAY.md (step-by-step checklist)
- **Parallel Tracks**: WEEK1-PARALLEL-TASKS.md (5 workstreams)
- **Executive Summary**: PARALLEL-WORKSTREAMS-SUMMARY.md
- **Scenario 1**: IMPLEMENTATION_GUIDE.md
- **SMC Strategy**: STRATEGY-SMC-GUIDE.md (Week 2)
- **Backtesting**: BACKTEST-RR-GUIDE.md (Week 3-4)
- **Architecture**: This file (ARCHITECTURE.md)

---

**Last Updated**: 22 May 2026, 14:35 ADL  
**Status**: Week 1 Foundation Complete — Ready for Parallel Execution  
**Next Review**: 28 May 2026, EOD (Week 1 completion check)
