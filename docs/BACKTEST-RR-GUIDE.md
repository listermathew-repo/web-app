# Backtesting & Risk:Reward Analysis Guide

## Overview

Risk:Reward (R:R) ratio is the cornerstone of our backtesting framework. This guide explains how we collect trade data, calculate R:R metrics, and use them to validate strategy profitability.

---

## 1. Data Collection

### Trade Execution Flow
```
Alert (TradingView) 
  ↓
POST /api/alerts (webhook receives EURUSD long @ 1.1635)
  ↓
Queue in pending_trades (manual approval step)
  ↓
POST /api/pending/[id]/approve (execute on Capital.com)
  ↓
Insert to trades table (status: 'executed')
  ↓
Manual exit (close position in Capital.com)
  ↓
Update trades table (exit_price, pnl, status: 'completed')
```

### Captured Metadata
Each completed trade logs:
- **Entry Point**: entry_price (from alert), entry_time (when alert fired)
- **Stop Loss**: stop_price (risk boundary, hardwired to prevent loss)
- **Exit Point**: exit_price (when manually closed or hit TP)
- **Position Size**: size (lot units, typically 1 lot = 100k for EURUSD)
- **Risk Amount**: risk_amount (USD at risk, typically $400)
- **Strategy**: strategy ('scenario_1' or 'smcfvg' for tracking)
- **Status**: status ('executed' → 'completed' when closed)

### Database Schema
```sql
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  symbol TEXT,
  direction TEXT,  -- 'long' or 'short'
  entry_price REAL,
  stop_price REAL,
  exit_price REAL,
  size REAL,  -- position size in lots
  risk_amount INTEGER,  -- USD
  pnl INTEGER,  -- profit/loss in USD
  strategy TEXT,  -- 'scenario_1' or 'smcfvg'
  status TEXT,  -- 'executed', 'completed', 'rejected'
  created_at TIMESTAMP,
  executed_at TIMESTAMP,
  exited_at TIMESTAMP
);
```

---

## 2. Risk:Reward Calculation

### Definition
**Risk:Reward Ratio** = Reward Distance / Risk Distance

### Calculation Formula

#### Risk Distance
```
Risk Distance = |Entry Price - Stop Price|

Example (Long Trade):
Entry: 1.1635
Stop: 1.1617
Risk = |1.1635 - 1.1617| = 0.0018 (18 pips in 4-digit notation)
```

#### Reward Distance
```
Reward Distance = |Exit Price - Entry Price|

Example (Long Trade):
Entry: 1.1635
Exit: 1.1670
Reward = |1.1670 - 1.1635| = 0.0035 (35 pips)
```

#### Actual R:R Achieved
```
Actual RR = Reward Distance / Risk Distance
          = 0.0035 / 0.0018
          = 1.94:1
```

### Implementation
See `src/lib/trade-logger.ts`:
```typescript
export function calculateActualRR(
  entry: number,
  exit: number,
  stop: number,
  direction: 'long' | 'short'
): number {
  const riskDistance = Math.abs(entry - stop);
  if (riskDistance === 0) return 0;
  
  if (direction === 'long') {
    const rewardDistance = Math.abs(exit - entry);
    return rewardDistance / riskDistance;
  } else {
    const rewardDistance = Math.abs(entry - exit);
    return rewardDistance / riskDistance;
  }
}
```

---

## 3. Profitability & Metrics

### Individual Trade Outcome
```
Win:     Exit Price > Stop Price (for long)
Loss:    Exit Price < Stop Price (for long)
Breakeven: Exit Price ≈ Stop Price (within tolerance)

P&L (USD) = (Reward Distance - Risk Distance) × Pip Value × Position Size
          = (0.0035 - 0.0018) × 10 × 1
          = 17 × 10 × 1
          = $170 profit
```

### Portfolio Statistics
Calculated across all completed trades:

```
Win Rate = (Trades Won / Total Trades) × 100%
         Example: 7 wins / 10 trades = 70%

Average RR = (Sum of All Actual RR) / Total Trades
           Example: (1.5 + 2.1 + 1.8 + ...) / 10 = 1.75:1

Total P&L = Sum of all individual P&L
          Example: $170 + $340 - $120 + ... = $2,450

Expectancy = (Win Rate × Avg Win Size) - (Loss Rate × Avg Loss Size)
           Must be positive for profitable strategy
```

---

## 4. Export & Analysis

### CSV Export
Access via `GET /api/backtest/export?format=csv`:
```
Date,Symbol,Direction,EntryPrice,ExitPrice,StopPrice,RRTarget,ActualRR,Result,PnL,RiskAmount,Strategy
2026-05-21,EURUSD,LONG,1.16350,1.16700,1.16170,1.50,1.94,WIN,170,400,smcfvg
2026-05-21,XAUUSD,SHORT,2450.50,2448.00,2452.50,1.50,2.12,WIN,200,400,scenario_1
2026-05-20,EURUSD,LONG,1.16200,1.16100,1.16050,1.50,1.01,LOSS,-99,400,smcfvg
```

### JSON Export
Access via `GET /api/backtest/export?format=json`:
```json
{
  "status": "ok",
  "count": 47,
  "trades": [...],
  "statistics": {
    "total_trades": 47,
    "wins": 28,
    "losses": 19,
    "breakeven": 0,
    "total_pnl": 4850,
    "win_rate": "59.57%"
  },
  "filters": {
    "strategy": "smcfvg",
    "symbol": null,
    "since": null,
    "until": null
  }
}
```

### External Tools
1. **Excel/Google Sheets**: Import CSV, create pivot tables by strategy/symbol
2. **Python Analysis**: Load JSON, compute Sharpe ratio, max drawdown
3. **TradingView Strategy Tester**: Cross-validate against historical data

---

## 5. Decision Framework

### Minimum Standards for Live Trading
- ✅ **Win Rate**: ≥ 55% (acceptable; 60%+ is strong)
- ✅ **Average RR**: ≥ 1.5:1 (below this, losses outpace wins)
- ✅ **Positive Expectancy**: (WR × Avg Win) > (LR × Avg Loss)
- ✅ **Sample Size**: ≥ 30 trades minimum (statistical confidence)

### Example Validation
```
Strategy: SMC/FVG
Trades: 45 completed
Wins: 26 (57.78%)
Losses: 19 (42.22%)
Avg Win: $285
Avg Loss: $150
Expectancy = (0.5778 × $285) - (0.4222 × $150)
           = $164.77 - $63.33
           = $101.44 per trade ✅ PASS

Average RR: 1.82:1 ✅ PASS
Total P&L: $4,565 ✅ PASS

Decision: APPROVE for live trading
```

### Red Flags
- ❌ **Low Win Rate** (< 50%): Requires RR > 2:1 to be profitable
- ❌ **Low RR** (< 1.2:1): Even 60% win rate may not cover losses
- ❌ **Negative Expectancy**: Strategy loses money on average
- ❌ **Small Sample** (< 20 trades): Statistical noise, not reliable

---

## 6. Dashboard Integration

### Strategy Comparison View
When strategy filter = "All", dashboard shows side-by-side stats:

```
┌─ Scenario 1 ──────────────────────────────────────┐
│ Total Trades: 23                                   │
│ Win Rate: 65.22%                                   │
│ Avg RR: 1.75:1                                     │
│ Total P&L: +$2,850                                 │
│ Status: ✅ STRONG                                  │
└────────────────────────────────────────────────────┘

┌─ SMC/FVG ─────────────────────────────────────────┐
│ Total Trades: 22                                   │
│ Win Rate: 54.55%                                   │
│ Avg RR: 1.87:1                                     │
│ Total P&L: +$1,815                                 │
│ Status: ⚠️ MARGINAL (needs more data)              │
└────────────────────────────────────────────────────┘
```

### Active Trade Monitoring
Each open position shows:
- **Entry Price** and **Stop Loss** (R:R setup visible)
- **Current P&L** (if exit now, profit/loss)
- **Risk:Reward Target** (what we aimed for at entry)
- **Strategy Tag** (which strategy generated this trade)

---

## 7. Monthly Review Checklist

At end of each month:
- [ ] Export all trades (CSV or JSON)
- [ ] Validate win rate (should be consistent ≥55%)
- [ ] Check average RR (should remain ≥1.5:1)
- [ ] Review losing trades (were they setup violations?)
- [ ] Identify best performing strategy (Scenario 1 vs SMC)
- [ ] Update documentation if rules changed
- [ ] Archive data for tax/compliance records

---

## Summary

| Metric | Formula | Min Target | Ideal |
|--------|---------|-----------|-------|
| **Risk Distance** | \|Entry - Stop\| | > 0 | 10-20 pips |
| **Reward Distance** | \|Exit - Entry\| | 15+ pips | 25+ pips |
| **Actual RR** | Reward / Risk | 1.2:1 | 1.75:1+ |
| **Win Rate** | (Wins / Total) × 100 | 55% | 60%+ |
| **Expectancy** | (WR × AvgWin) - (LR × AvgLoss) | > 0 | +$100/trade |
| **Sample Size** | Total trades | 30+ | 100+ |

**Last Updated**: 2026-05-22  
**Framework Version**: RR v1.0  
**Database**: better-sqlite3 (Vercel serverless)  
**Export Formats**: CSV (Excel), JSON (API/Python)  
