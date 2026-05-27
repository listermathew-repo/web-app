# Trading System Architecture

## High-Level Overview

```
┌─────────────┐
│ TradingView │
│ Pine Script │
└──────┬──────┘
       │ Webhook (POST /api/alerts)
       ▼
┌──────────────────────────────────────┐
│     Trading System (Next.js 16)      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  API Routes                      │ │
│ │  • /api/alerts         (webhook) │ │
│ │  • /api/pending        (queue)   │ │
│ │  • /api/pending/[id]/approve     │ │
│ │  • /api/pending/[id]/reject      │ │
│ │  • /api/positions      (live)    │ │
│ │  • /api/health         (monitor) │ │
│ │  • /api/trading-pause  (pause)   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  Dashboard UI (React)            │ │
│ │  • Pending Trades Widget         │ │
│ │  • Economic Calendar             │ │
│ │  • Trade Execution Monitor       │ │
│ │  • Positions Display             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  Core Libraries                  │ │
│ │  • trade-validator.ts (10-point) │ │
│ │  • capital-client.ts (broker API)│ │
│ │  • trading-pause.ts (events)     │ │
│ │  • alerts-redundancy.ts (ntfy)   │ │
│ │  • health-check-scheduler.ts     │ │
│ │  • db.ts (SQLite ORM)            │ │
│ └──────────────────────────────────┘ │
└──────┬───────────┬───────────┬───────┘
       │           │           │
       ▼           ▼           ▼
┌───────────┐ ┌──────────────┐ ┌──────────┐
│  Capital  │ │ SQLite DB    │ │ ntfy.sh  │
│  .com API │ │              │ │Webhooks  │
│           │ │ • Trades     │ │          │
│ Orders    │ │ • Pending    │ │ Alerts   │
│ Positions │ │ • Health     │ │ Notifs   │
│ Prices    │ │ • Logs       │ │          │
└───────────┘ └──────────────┘ └──────────┘
```

## Component Breakdown

### 1. API Layer (`src/app/api/`)

#### Trade Alert Webhook
- **Route**: `POST /api/alerts`
- **Function**: Receives alerts from TradingView Pine Script
- **Validation**: 10-point checklist (EMA, VWAP, volume, ATR, timing, etc.)
- **Output**: Queue trade for manual approval (pending_trades table)
- **Security**: X-API-Key header authentication

#### Pending Queue Manager
- **Route**: `GET /api/pending`
- **Function**: List trades awaiting manual approval
- **Features**: 5-minute expiration, auto-cleanup

#### Trade Approval Endpoint
- **Route**: `POST /api/pending/{id}/approve`
- **Function**: Execute trade on Capital.com
- **Features**: 
  - Check trading pause status
  - Execute order via Capital.com API
  - Log execution to trades table
  - Send ntfy alert on success/failure

#### Trade Rejection Endpoint
- **Route**: `POST /api/pending/{id}/reject`
- **Function**: Manually reject queued trade
- **Features**: Log rejection reason, send alert

#### Positions Tracker
- **Route**: `GET /api/positions`
- **Function**: Get open positions with live P&L
- **Data Source**: Database + Capital.com API (live prices)
- **Caching**: 30-second TTL

#### Health Monitor
- **Route**: `GET /api/health`
- **Function**: System status dashboard
- **Checks**: Database, Capital.com, ntfy.sh, webhooks
- **Frequency**: 15-minute cron (via /api/health-check-cron)

#### Trading Pause Status
- **Route**: `GET /api/trading-pause`
- **Function**: Check if trading is paused due to economic events
- **Pause Window**: ±15 minutes around high-impact events

---

### 2. Database Layer (`src/lib/db.ts`)

**Type**: SQLite (better-sqlite3)  
**Location**: `.db/trading.db`  
**Rationale**: Serverless-friendly, zero-setup, fast, Vercel-compatible

#### Schema

```sql
-- Queued trades awaiting approval
pending_trades (
  id TEXT PRIMARY KEY,
  symbol TEXT,
  direction TEXT,          -- 'long', 'short'
  entry_level REAL,
  stop_level REAL,
  retap_level REAL,        -- Take profit
  risk_amount INTEGER,     -- $400 typical
  scenario TEXT,           -- 'scenario_1', etc
  created_at TIMESTAMP,
  expires_at TIMESTAMP,    -- Auto-reject after 5 min
  status TEXT,             -- 'pending', 'approved', 'rejected'
  execution_price REAL,
  deal_reference TEXT      -- Capital.com order ID
)

-- Trade execution history
trades (
  id TEXT PRIMARY KEY,
  symbol TEXT,
  direction TEXT,
  entry_price REAL,
  stop_price REAL,
  retap_level REAL,
  size REAL,               -- Lot size
  risk_amount INTEGER,
  deal_reference TEXT,
  status TEXT,             -- 'pending', 'executed', 'closed'
  created_at TIMESTAMP,
  executed_at TIMESTAMP,
  exit_price REAL,
  pnl INTEGER,             -- Profit/loss in USD
  message TEXT
)

-- System health tracking
system_health (
  component TEXT,          -- 'database', 'capital_com', 'ntfy'
  status TEXT,             -- 'ok', 'error'
  message TEXT,
  last_check TIMESTAMP,
  error_count INTEGER
)

-- Alert event logging
alert_log (
  symbol TEXT,
  level TEXT,              -- 'breakout', 'retap', 'stop'
  price REAL,
  timestamp TIMESTAMP
)
```

#### Key Functions

| Function | Purpose |
|----------|---------|
| `insertPendingTrade()` | Queue new trade |
| `getPendingTrades()` | List awaiting approval |
| `approvePendingTrade()` | Mark approved + execution details |
| `rejectPendingTrade()` | Mark rejected + reason |
| `insertTrade()` | Log execution to history |
| `getOpenPositions()` | Get active trades |
| `getTradeHistory()` | Query trade history with filters |
| `logHealthCheck()` | Record component status |
| `isTradeExpired()` | Check 5-minute window (SQLite datetime) |

---

### 3. Core Business Logic

#### Trade Validator (`src/lib/trade-validator.ts`)

10-point validation checklist:

1. **Basic Validation**: Symbol, direction, prices
2. **Risk Management**: Risk amount, stop loss validity
3. **EMA Alignment**: EMA10 > EMA21 for long, reverse for short
4. **VWAP Confirmation**: Price > VWAP for long, reverse for short
5. **Volume Confirmation**: Volume >= 1.5x 20-bar average
6. **ATR Volatility**: ATR between 10-50 pips
7. **4H Candle Timing**: Alert must be ≤30 min after 4H close
8. **Confluence Score**: (Reserved for future ML)
9. **Chart Confirmation**: All above checks combined
10. **Final Gate**: (Reserved for market regime filter)

**Returns**: `{ isValid: boolean, rejectionReasons: string[] }`

#### Capital.com Client (`src/lib/capital-client.ts`)

Wrapper around Capital.com REST API:

```typescript
class CapitalClient {
  executeOrder(symbol, direction, size, stopPrice)
    → { status, dealReference, reason }
  
  getOpenPositions()
    → [{symbol, entry, current, pnl, size}]
  
  closePosition(dealId)
    → { status }
}
```

#### Trading Pause Logic (`src/lib/trading-pause.ts`)

Prevents trading during high-impact economic events:

```typescript
isTradingPaused()
  → { isPaused, reason, resumesAt, minutesUntilResume }

getNextHighImpactEvent()
  → { event, impact, time }
```

**High-Impact Events**: NFP, CPI, Interest Rate Decision, GDP, Retail Sales, etc.

#### Alert Redundancy (`src/lib/alerts-redundancy.ts`)

Sends ntfy.sh notifications with retry logic:

```typescript
sendMultiChannelAlert({
  symbol,
  level,      // 'triggered', 'ok'
  severity,   // 'info', 'warning', 'critical'
  timestamp
})
```

#### Health Check Scheduler (`src/lib/health-check-scheduler.ts`)

Monitors system every 15 minutes:

```typescript
runHealthCheck()
  → [
      { component: 'database', status: 'ok' },
      { component: 'capital_com', status: 'ok' },
      { component: 'ntfy', status: 'ok' },
      { component: 'webhook', status: 'ok' }
    ]
```

---

### 4. Dashboard UI (`src/components/`)

#### PendingTradesWidget.tsx
- Shows queued trades with countdown timer
- Approve/Reject buttons
- Color-coded by time remaining
- Real-time updates every 3 seconds

#### EconomicCalendar.tsx
- Displays upcoming high-impact events
- Shows time until event
- Auto-displays pause banner when active
- Forecast vs. Previous values

#### TradeExecutionMonitor.tsx
- Daily P&L, win rate, winners/losers
- Hourly setup distribution
- Confluence score histogram
- Open positions with current P&L

---

## Data Flow: Alert to Execution

```
1. TradingView Pine Script detects setup
   ↓
2. Sends webhook to POST /api/alerts
   ├─ Validates X-API-Key
   ├─ Validates 10-point checklist
   ├─ Inserts into pending_trades
   └─ Sends "📋 Pending Approval" ntfy alert
   ↓
3. User sees trade in Dashboard widget
   ├─ Countdown timer (5 minutes)
   ├─ Approve button
   └─ Reject button
   ↓
4. User clicks "Approve"
   ├─ Checks trading pause status
   ├─ Checks if trade expired
   ├─ Executes via Capital.com API
   ├─ Updates pending_trades.status = 'approved'
   ├─ Inserts into trades table
   └─ Sends "✅ Executed" ntfy alert
   ↓
5. Position now live
   ├─ Dashboard shows position + P&L
   ├─ Health check monitors Capital.com
   └─ Auto-exit logic (future: take profit/stop loss)
```

---

## Security Architecture

### Authentication

- **Webhook**: X-API-Key header (32-char secret)
- **Frontend**: Cookie-based (wiki-auth, 30-day TTL)
- **Internal**: Implicit (backend→backend calls)

### Data Protection

- Database credentials in `.env.local` (NOT in git)
- Capital.com API key encrypted in production
- No API keys logged or exposed in error messages
- HTTPS on production (Vercel enforces)

### Rate Limiting

- Duplicate trade detection: 30-second window
- API rate limits: 100 requests/minute (configurable)
- Database timeout: 5 seconds

---

## Deployment Architecture

### Local Development

```
Node.js 18+ → Next.js dev server → SQLite (.db/)
```

### Production (Vercel)

```
GitHub push → CI tests → Vercel build → Edge functions
                        ↓
                    Serverless API routes
                        ↓
                    SQLite on /tmp (ephemeral)
                        
Note: Consider Vercel Postgres for production persistence
```

---

## Scaling Considerations

### Single Account (Current)

- 1 API instance
- 1 SQLite database
- 1 ntfy topic

### Multi-Account (Future)

- N API instances (separate Vercel projects or same with env vars)
- Shared or per-account databases
- Separate ntfy topics per account
- Load balancer (Vercel native)

### Performance

| Metric | Target | Current |
|--------|--------|---------|
| Alert processing | < 1 sec | ~500ms |
| Approval latency | < 5 sec | ~2-3 sec |
| Dashboard refresh | < 3 sec | ~2 sec |
| Health check | < 10 sec | ~5 sec |
| Database query | < 100ms | ~20-50ms |

---

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 18+ | Serverless-friendly |
| Framework | Next.js 16 | Full-stack, SSR, API routes |
| Language | TypeScript | Type safety, IDE support |
| Database | SQLite | Serverless, zero-setup, fast |
| Validation | Zod | Type-safe schemas |
| Styling | Tailwind CSS | Utility-first, responsive |
| Testing | Vitest | Fast, ESM-native |
| Hosting | Vercel | Optimized for Next.js |
| Notifications | ntfy.sh | Simple webhooks, mobile push |
| Broker | Capital.com | REST API, demo mode |

---

## Error Handling Strategy

### API Level
- Validate input with Zod schemas
- Return specific HTTP status codes (401, 400, 403, 410, 500)
- Include error reason in JSON response

### Database Level
- SQLite error handling with try/catch
- Automatic reconnection on timeout
- Transaction rollback on failure

### Capital.com Level
- Graceful degradation if API down
- Fallback to manual execution mode
- Retry logic with exponential backoff

### ntfy.sh Level
- Non-blocking (fire and forget)
- No retry (acceptable for alerting)
- Fallback to email (future)

---

## Monitoring & Observability

### Logging
- Console logs to stdout (Vercel captures)
- Structured logs with `[COMPONENT]` prefix
- Log levels: INFO, WARN, ERROR

### Metrics
- Health check results stored in DB
- Trade execution latency tracked
- API response times via middleware

### Alerts
- CRITICAL: Authentication failures, database errors
- WARNING: Trading paused, duplicate trades
- INFO: Trade execution, approvals

---

## Next Steps & Future Enhancements

1. **Database Persistence**: Migrate to Vercel Postgres or external DB
2. **Real-time Updates**: WebSocket instead of polling
3. **Multi-Account**: Extend for 4 funded accounts
4. **Auto-Exit Logic**: Automatic stop loss + take profit
5. **Risk Management**: Max loss alerts, position sizing
6. **Backtesting**: Integrated backtest engine
7. **ML Integration**: Confluence score prediction
8. **Mobile App**: React Native companion app
9. **Analytics Dashboard**: Trade analysis + P&L reports
10. **Paper Trading**: Simulate without real capital

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-26  
**Architecture Review**: Every quarter  
