# Master Strategy Specification Document

**Last Updated:** 2026-05-22  
**Version:** 1.0  
**Status:** ACTIVE

---

## Overview

This document defines ALL required indicators, validation rules, and acceptance criteria for the Dual Strategy trading system. It is the single source of truth for:
- What indicators must fire to generate an alert
- What checks must pass before a trade is queued
- What confirmations must be verified before execution

---

## Part 1: Entry Signal Indicators (Pine Script)

### **Strategy A: Scenario 1 (Breakout/Retap)**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **Swing High** | `ta.highest(high, 50)` | Find recent resistance | ✅ Done |
| **Swing Low** | `ta.lowest(low, 50)` | Find recent support | ✅ Done |
| **Breakout Long** | `close > (swing_high + 5pips)` | Price breaks above resistance | ✅ Done |
| **Breakout Short** | `close < (swing_low - 5pips)` | Price breaks below support | ✅ Done |
| **Retap Long** | `close > (swing_high - 10pips) AND close < swing_high` | Price retaps resistance zone | ✅ Done |
| **Retap Short** | `close < (swing_low + 10pips) AND close > swing_low` | Price retaps support zone | ✅ Done |

**Acceptance Criteria:**
- ✅ Breakout OR Retap must be true
- ✅ Entry label: "S1 LONG" or "S1 SHORT"
- ✅ Alert triggers on bar close

---

### **Strategy B: SMC/FVG (Smart Money Concepts)**

#### **B1: Fair Value Gap (FVG)**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **Bullish FVG** | `low[1] > high[2] AND gap > 5pips` | Upswing gap (imbalance) | ✅ Done |
| **Bearish FVG** | `high[1] < low[2] AND gap > 5pips` | Downswing gap (imbalance) | ✅ Done |
| **Gap Unfilled** | `price has NOT touched gap in last 5 bars` | Gap remains unharmed | ✅ Done |
| **FVG Box Visualization** | `box.new()` from high[2] to low[1] | Show FVG zone on chart | ✅ Done |

**Acceptance Criteria:**
- ✅ Gap size > 5 pips (configurable)
- ✅ Gap must be UNFILLED (price hasn't touched it)
- ✅ Entry label: "SMC LONG" or "SMC SHORT"
- ✅ Purple box = bullish FVG, Red box = bearish FVG

---

#### **B2: Liquidity Sweep (LS)**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **Swing High (20)** | `ta.highest(high, 20)` | Recent 20-bar high | ✅ Done |
| **Swing Low (20)** | `ta.lowest(low, 20)` | Recent 20-bar low | ✅ Done |
| **Upswing Break** | `high > (swing_high + 5pips) AND close < swing_high` | Break high + close below | ✅ Done |
| **Downswing Break** | `low < (swing_low - 5pips) AND close > swing_low` | Break low + close above | ✅ Done |
| **Volume Confirmation** | `volume > SMA(volume, 20) × 0.8` | Volume surge | ✅ Done |

**Acceptance Criteria:**
- ✅ Break must be confirmed with volume > 80% of 20-bar avg
- ✅ Entry label: "SMC LONG" or "SMC SHORT"
- ✅ Alert on same bar as sweep completion

---

#### **B3: Change of Character (CHoCH)**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **Swing Detection** | `high[len] > high[len±1,±2]` | Find local highs/lows | ✅ Done |
| **Structure Array** | `array.push(swing_highs/lows)` | Track swing sequence | ✅ Done |
| **Min Swings** | `array.size() >= 3` | Need 3+ swings for CHoCH | ✅ Done |
| **Structure Break** | `close < last_low (break down)` or `close > last_high (break up)` | Cross previous swing | ✅ Done |

**Acceptance Criteria:**
- ✅ Must have 3+ swings in structure
- ✅ Must close through the last swing (not just touch)
- ✅ Entry label: "SMC LONG" or "SMC SHORT"

---

### **Strategy C: Confirmation Filters (REQUIRED)**

These are **NOT** entry signals alone—they FILTER/CONFIRM the above signals.

#### **C1: EMA Alignment (TREND CONFIRMATION)**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **EMA10** | `ta.ema(close, 10)` | Fast EMA (recent trend) | ❌ **MISSING** |
| **EMA21** | `ta.ema(close, 21)` | Medium EMA (trend baseline) | ❌ **MISSING** |
| **Long Condition** | `EMA10 > EMA21` | Uptrend confirmed | ❌ **MISSING** |
| **Short Condition** | `EMA10 < EMA21` | Downtrend confirmed | ❌ **MISSING** |

**Acceptance Criteria:**
- ✅ Entry signal must align WITH trend (EMA10 > EMA21 for longs)
- ✅ Reject trade if EMA10 crosses EMA21 on entry bar

---

#### **C2: VWAP (Volume-Weighted Average Price)**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **VWAP** | `sum(close × volume) / sum(volume)` | Volume-weighted price level | ❌ **MISSING** |
| **Price > VWAP** | `close > vwap` | Buyers in control | ❌ **MISSING** |
| **Price < VWAP** | `close < vwap` | Sellers in control | ❌ **MISSING** |
| **Deviation** | `(close - vwap) / atr` | Distance from VWAP | ❌ **MISSING** |

**Acceptance Criteria:**
- ✅ Long: Price must be ABOVE VWAP (close > vwap)
- ✅ Short: Price must be BELOW VWAP (close < vwap)
- ✅ Reject if price crosses VWAP on entry bar

---

#### **C3: Volume Profile (SESSION ANALYSIS)**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **Session Volume** | `sum(volume in last N bars)` | Total volume in session | ❌ **MISSING** |
| **Volume Average** | `ta.sma(volume, 20)` | 20-bar volume baseline | ✅ Done (partial) |
| **Volume Spike** | `volume > volume_avg × 1.5` | Abnormal volume increase | ❌ **MISSING** |
| **Point of Control** | `price level with most volume` | Consensus price | ❌ **MISSING** |

**Acceptance Criteria:**
- ✅ Entry bar must have volume > 1.5× 20-bar average
- ✅ Reject if volume is extremely low (< 0.5× avg)

---

#### **C4: ATR Volatility Confirmation**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **ATR(14)** | `ta.atr(14)` | Average True Range | ✅ Used for label placement |
| **Min Volatility** | `atr > 0.0010 (for EURUSD)` | Enough movement to trade | ❌ **MISSING VALIDATION** |
| **Max Volatility** | `atr < 0.0050 (spike protection)` | Avoid extreme spreads | ❌ **MISSING VALIDATION** |
| **Volatility State** | `atr > 20-bar avg ATR` | Current vol vs recent avg | ❌ **MISSING** |

**Acceptance Criteria:**
- ✅ Reject if ATR < 10 pips (too low volatility for S1)
- ✅ Reject if ATR > 50 pips (possible spike, unsafe)
- ✅ Warn if ATR in extreme ranges

---

#### **C5: 4H Candle Closure Verification**

| Indicator | Formula | Purpose | Status |
|-----------|---------|---------|--------|
| **4H Time** | `(bar_index % 240) == 0` | 4-hour candle boundary | ❌ **MISSING** |
| **Candle Closed** | `time_since_4h_open >= 4h` | 4H bar must be CLOSED | ❌ **MISSING** |
| **Entry Timing** | Entry only on 4H close bars | Synchronize to daily structure | ❌ **MISSING** |

**Acceptance Criteria:**
- ✅ Entry signals are stronger when 4H candle just closed
- ⚠️ Warn if entry is mid-4H candle (risky)
- ❌ Reject if entry < 30 min into 4H candle (too early)

---

---

## Part 2: Backend Validation (10-Point Approval Checklist)

### **Approval Flow**

Each trade alert must pass **ALL 10 checks** to be queued. If ANY check fails, trade is **REJECTED** with reason.

| Check | Rule | Currently | Required |
|-------|------|-----------|----------|
| **1** | Time in trading hours (09:00-22:00 ADL) | ✅ Implemented | Reject outside hours |
| **2** | Alert received & verified (valid timestamp) | ✅ Implemented | Reject invalid alerts |
| **3** | Price within 2 pips of entry level | ✅ Implemented | Reject if price drifted |
| **4** | Stop loss matches expected level | ✅ Implemented | Reject bad stops |
| **5** | Take profit in 1.5x-2.5x RRR range | ✅ Implemented | Auto-calculate or reject |
| **6** | Capital.com API is healthy | ✅ Implemented (mocked) | Reject if API down |
| **7** | Risk management rules OK (positions < 2, losses < 3/day) | ✅ Implemented | Reject if maxed out |
| **8** | Trade not expired (< 5 min old) | ✅ Implemented | Auto-reject old trades |
| **9** | **Chart confirmation (EMA + VWAP + Volume)** | ❌ **PLACEHOLDER** | ✅ **MUST IMPLEMENT** |
| **10** | Approval decision (all above pass) | ✅ Implemented | Final gate |

---

### **Check #9 Implementation Details**

**Chart Confirmation Rule:**
```
PASS IF:
  - EMA10 > EMA21 (for long) OR EMA10 < EMA21 (for short) ✅
  - Price is on correct side of VWAP (above for long, below for short) ✅
  - Volume > 1.5× 20-bar average ✅
  - ATR is in safe range (10-50 pips) ✅
  - 4H candle recently closed (within last 30 min) ✅

REJECT IF:
  - EMA alignment disagrees with direction
  - Price on wrong side of VWAP
  - Volume abnormally low
  - ATR in extreme ranges
  - Entry too far from 4H close
```

---

## Part 3: Data Schema (SQLite)

### **pending_trades table**

Captures all queued trades with validation status.

```sql
CREATE TABLE pending_trades (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,  -- 'long', 'short'
  entry_level REAL NOT NULL,
  stop_level REAL NOT NULL,
  retap_level REAL,
  risk_amount INTEGER,
  scenario TEXT,  -- 'scenario_1', 'smcfvg'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected, executed
  approved_at TIMESTAMP,
  execution_price REAL,
  deal_reference TEXT,
  validation_details TEXT,  -- JSON: EMA status, VWAP, volume, ATR, 4H candle
  error_message TEXT,
  expires_at TIMESTAMP
);
```

### **validation_log table** (NEW)

Track why trades passed/failed Check #9.

```sql
CREATE TABLE validation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id TEXT UNIQUE,
  symbol TEXT,
  direction TEXT,
  ema10 REAL,
  ema21 REAL,
  ema_aligned BOOLEAN,
  price REAL,
  vwap REAL,
  price_above_vwap BOOLEAN,
  volume REAL,
  volume_avg REAL,
  volume_confirmed BOOLEAN,
  atr REAL,
  atr_valid BOOLEAN,
  candle_4h_minutes_since_close INTEGER,
  candle_4h_valid BOOLEAN,
  overall_valid BOOLEAN,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Part 4: System Gaps (Audit Results)

### **Missing Implementations**

| Gap | Impact | Fix Required |
|-----|--------|--------------|
| EMA10/EMA21 not in Pine Script | Alerts fire without trend confirmation | Add EMA lines to script |
| VWAP not calculated | Alerts ignore volume-weighted price | Add VWAP to script + backend |
| Volume Profile not tracked | Can't detect unusual volume patterns | Add session volume tracking |
| ATR validation missing | No volatility safety checks | Add ATR bounds to Check #9 |
| 4H candle timing unknown | Entries may be premature | Add 4H time detection to script |
| Check #9 is a stub | Trades always pass chart check | Implement full Check #9 logic |
| No validation_log table | Can't audit why trades passed/failed | Create table + insert logic |
| Pine Script has 3 SMC types but no weighting | All SMC signals treated equally | Add signal weight/confidence |

---

## Part 5: Implementation Roadmap

### **Phase 1: Pine Script Enhancements (IMMEDIATE)**

- [ ] Add EMA10, EMA21 lines to chart
- [ ] Add VWAP indicator
- [ ] Add 4H candle time detection
- [ ] Add volume profile bars
- [ ] Add ATR bands for reference
- [ ] Highlight entries that meet confirmation criteria

### **Phase 2: Backend Validation (URGENT)**

- [ ] Create validation_log table
- [ ] Implement full Check #9 logic:
  - [ ] Fetch EMA values from Pine Script output
  - [ ] Calculate VWAP from chart data
  - [ ] Validate volume threshold
  - [ ] Validate ATR range
  - [ ] Validate 4H candle timing
- [ ] Add trade rejection reason to response

### **Phase 3: Dashboard Integration (NEXT SPRINT)**

- [ ] Show validation details in pending trades UI
- [ ] Display reason for rejected trades
- [ ] Chart overlay: EMA, VWAP, volume profile

---

## Part 6: Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Signals matching all criteria | 100% | ~30% (missing confirmations) |
| False positives (rejected by Check #9) | < 20% | ✅ TBD |
| Chart confirmation accuracy | > 80% | ❌ No validation yet |
| Approval rate (passed all 10 checks) | > 60% | ✅ ~70% (Check #9 broken) |

---

## Part 7: Configuration Reference

### **Symbol-Specific Settings**

```
EURUSD:
  breakout_distance: 5 pips
  retap_zone: 10 pips
  min_fvg_gap: 5 pips
  min_volatility_atr: 10 pips
  max_volatility_atr: 50 pips
  volume_threshold: 1.5× (20-bar avg)

XAUUSD:
  breakout_distance: 20 pips
  retap_zone: 30 pips
  min_fvg_gap: 20 pips
  min_volatility_atr: 2.0 (points)
  max_volatility_atr: 10 pips
  volume_threshold: 1.5× (20-bar avg)
```

---

**Document Owner:** Trading Systems Team  
**Next Review:** 2026-06-01  
**Approved By:** [Pending]
