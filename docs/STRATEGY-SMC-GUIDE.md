# SMC/FVG/CHOCH Strategy Guide

## Overview

**Smart Money Concepts (SMC)** is a price action trading methodology focused on how institutional traders (smart money) move markets. This guide covers the three core SMC components detected by our strategy.

---

## 1. Liquidity Sweep (LS)

A liquidity sweep occurs when price breaks recent highs/lows to trigger retail stop-losses, then reverses sharply. Smart money uses these sweeps to accumulate or distribute positions.

### Detection Rules
- **For Upswings**: Break above recent swing high by 5+ pips, then close below that high
- **For Downswings**: Break below recent swing low by 5+ pips, then close above that low
- Volume confirmation: Current candle volume > average volume × 0.8

### Trading Setup
- **Entry**: After liquidity sweep + confirmation candle (close back inside range)
- **Stop Loss**: Just beyond the liquidity sweep point
- **Take Profit**: Opposite side of the sweep + Risk:Reward ratio (1.5:1 minimum)

### Example (EURUSD Daily)
```
[Recent High: 1.1200]
   ↑ Price breaks to 1.1210 (LS trigger)
   ↓ Reverses, closes below 1.1200 (LS confirmed)
→ Entry: Buy on retest of 1.1200-1.1205 zone
→ Stop: 1.1190 (below LS low)
→ TP: 1.1220 (Risk = 10-15 pips, Reward = 15-20 pips)
```

---

## 2. Fair Value Gap (FVG)

A fair value gap is an imbalance in price movement where a candle's high/low "gaps" without the market filling that gap immediately. Price often returns to fill FVGs, creating reliable bounce zones.

### Detection Rules
- **Bullish FVG**: Low of candle 2 > High of candle 1 (upswing gap)
- **Bearish FVG**: High of candle 2 < Low of candle 1 (downswing gap)
- Gap size: 5+ pips (minimum 0.0005 for 5-digit pairs like EURUSD)
- Unfilled: No candle has filled the gap in the last 3-5 bars

### Trading Setup
- **Entry**: Price returns to FVG zone (50-75% of gap filled)
- **Stop Loss**: Beyond the gap extremity
- **Take Profit**: Previous swing high/low or next resistance/support

### Example (EURUSD 1H)
```
[Bar 1: High 1.1050, Low 1.1040]
[Bar 2: High 1.1065, Low 1.1055] ← FVG created (Low 1.1055 > High 1.1050)
  Unfilled gap: 1.1050-1.1055 (5 pips)

→ Wait for price retracement toward 1.1050-1.1055
→ Entry: Buy at 1.1053 (inside FVG)
→ Stop: 1.1049 (below FVG low)
→ TP: Previous resistance at 1.1075
```

---

## 3. Change of Character (CHoCH)

A change of character marks a shift from one market structure to another. It signals a transition from impulsive movement (trending) to corrective movement (consolidation) or vice versa.

### Detection Rules
- **Uptrend Broken**: Price closes below the last swing low (after making higher lows)
- **Downtrend Broken**: Price closes above the last swing high (after making lower highs)
- Confirmation: Next candle continues in the new direction
- Structure shift: At least 3 swings in the original direction before CHoCH

### Trading Setup
- **Entry**: Confirm CHoCH direction with candle close + retest of broken structure
- **Stop Loss**: Beyond the broken swing level
- **Take Profit**: Next major resistance/support or Risk:Reward ratio

### Example (EURUSD 4H)
```
[Uptrend: LL1 → LH1 → LL2 → LH2 → LL3 → LH3]
[Price breaks below LL3] ← CHoCH triggered
  Closes below LL3 on 4H candle

→ Confirm: Next candle continues downward
→ Entry: Sell on retest of LL3 level
→ Stop: 5 pips above LL3 (broken structure)
→ TP: Next major support level
```

---

## Integration with Trading System

### Dual-Strategy Tagging
When our Pine Script detects SMC signals, trades are tagged with:
- `scenario='smcfvg'` — Trade originates from SMC/FVG/CHOCH detection
- `strategy='SMC/FVG'` — Dashboard filters and displays these separately

### Risk Management
- **Minimum RR Ratio**: 1.5:1 (risk $100, target $150 minimum)
- **Position Sizing**: Based on risk_amount (typically $400/trade)
- **Stop Loss Placement**: Always at logical level (LS point, FVG edge, or CHoCH level)

### Backtesting Metrics
- **Win Rate Target**: 55%+ (SMC setups historically 55-60%)
- **Avg RR Achieved**: 1.8:1 or better
- **Expectancy**: (Win Rate × Avg Win) - (Loss Rate × Avg Loss) > 0

---

## Summary

| Concept | Signal | Entry | Stop | TP |
|---------|--------|-------|------|-----|
| **Liquidity Sweep** | Break + reverse of swing | Retest zone | Beyond sweep | 1.5:1 RR |
| **Fair Value Gap** | Unmatched gap (5+ pips) | Gap retracement | Beyond gap | Prev S/R |
| **CHoCH** | Broken structure + confirm | Retest level | Beyond level | Next S/R |

All three integrate into a cohesive flow:
1. **Identify structure** (uptrend or downtrend via swing analysis)
2. **Locate gaps & sweeps** (imbalances + institutional moves)
3. **Confirm with CHoCH** (direction change signals reversal)
4. **Trade with RR discipline** (1.5:1 minimum per trade)

---

**Last Updated**: 2026-05-22  
**Strategy Version**: SMC v1.0 (Pine Script v7)  
**Adelaide Timezone**: All times in HH:MM ADL format  
