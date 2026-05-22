# BI-WEEKLY SPRINT TEMPLATE — Tactical Optimization Review

**Duration**: 45 minutes  
**Schedule**: Monday 19:00 ADL (every other week, starting Monday of odd weeks)  
**Purpose**: Review tactical trading decisions, optimize execution levers, validate position sizing strategy, plan optimization focus  

---

## SECTION 1: SPRINT OVERVIEW

```
Sprint number: _____ (1=May 26-Jun 8, 2=Jun 9-22, etc.)
Sprint period: _____ to _____
Trading status: (Trading month / Holiday month)
Cumulative P&L this period: $_________ (target: $9,200+)
Cumulative trades: _____ (target: 10-12)
Cumulative win rate: ___% (target: 62%+)
```

---

## SECTION 2: TACTICAL LEVER PERFORMANCE

### Lever 1: Stage 5 Trigger Timing (2M/1M Confirmation)

```
METRIC:
- Trades triggered at perfect Stage 5: ____ (target: 90%+ of total)
- Trades triggered early (Stage 4.5): ____ (rushed?)
- Trades triggered late (after Stage 5): ____ (missed confirmation?)

QUALITY SCORE: __/10

ROOT CAUSE ANALYSIS (if <90% perfect):
What prevented perfect Stage 5 timing?
- Market volatility too high (hard to catch exact candle)
- System alert delay (late notification)
- Manual execution too slow (couldn't enter fast enough)
- Other: ___________________________

OPTIMIZATION ACTION:
☐ Improve 2M/1M confluence threshold (currently ___/100, target 75)
☐ Tighten entry zone (reduce slippage window)
☐ Increase system alert urgency (reduce notification delay)
☐ Practice faster manual execution (simulate rapid entries)
☐ Other: ____________________________
```

---

### Lever 2: Confluence Threshold Management

```
CURRENT SETTING: ___/100 (default 70, optimization target 75)

ANALYSIS:
- Trades at 70-74 confluence: _____ | Win rate: ___% | P&L: $_____
- Trades at 75-79 confluence: _____ | Win rate: ___% | P&L: $_____
- Trades at 80-99 confluence: _____ | Win rate: ___% | P&L: $_____
- Trades at 100 confluence: _____ | Win rate: ___% | P&L: $_____

INSIGHT:
Which confluence bracket had highest win rate? ___/100 (win rate: __%)

RECOMMENDATION:
☐ Maintain current threshold (70/100)
☐ Increase to 75/100 (+trades at low confluence, expect -1% win rate impact)
☐ Increase to 80/100 (-trades, expect +2% win rate improvement)
☐ Custom threshold: ___/100

DECISION FOR NEXT SPRINT:
New threshold: ___/100

EXPECTED IMPACT:
- Win rate change: +__% / -__%
- Trade count change: +___ / -___
- Monthly P&L impact: $_____
```

---

### Lever 3: Peak Window Optimization (2pm-4pm ADL)

```
PEAK WINDOW ANALYSIS (2pm-4pm ADL):
- Total trades in peak: ____ 
- Wins in peak: ____ (win rate: __%)
- P&L in peak: $_____
- Efficiency: $_____/hour (revenue per hour)

FULL HOURS ANALYSIS (9am-10pm ADL):
- Total trades: ____
- Wins: ____ (win rate: __%)
- P&L: $_____
- Efficiency: $_____/hour

COMPARISON:
- Peak window win rate: __% vs. Full hours win rate: __%
- Peak efficiency: $_____/hour vs. Full hours: $_____/hour
- Peak is X.X times more efficient than full hours

INSIGHT:
Is peak window statistically better? Y/N
Confidence level: __/10

RECOMMENDATION:
☐ Continue trading full hours (9am-10pm ADL)
☐ Switch to peak window only (2pm-4pm ADL) — +opportunity cost tradeoff
☐ Hybrid: Trade peak window + selective full hours (__am-__pm ADL)

DECISION FOR NEXT SPRINT:
Trading window: _________________________

EXPECTED IMPACT:
- Daily trade count: _____ (vs. current _____)
- Weekly P&L: $_____  (vs. current $_____)
- Fatigue reduction: Y/N
```

---

### Lever 4: Risk:Reward Ratio Management

```
CURRENT R:R SETTING: 5:1 (fixed $350 stop × 5 = $1,750 target)

ANALYSIS THIS SPRINT:
- Trades with 5:1 R:R: ____ | Win rate: __% | P&L: $_____
- Trades with 4:1 R:R: ____ | Win rate: __% | P&L: $_____
- Trades with 6:1+ R:R: ____ | Win rate: __% | P&L: $_____

INSIGHT:
Which R:R ratio had best risk-adjusted return? ___:1

OPTIMIZATION OPPORTUNITY:
Currently targeting 5:1. Based on historical data:
- Should we lower to 4:1 (hit targets more often)?
- Should we increase to 6:1 (higher win per trade)?
- Should we keep mixed ratios per market condition?

DECISION FOR NEXT SPRINT:
Target R:R: ___:1

EXPECTED IMPACT:
- Probability of hit target: +_% / -_%
- Average win amount: +$___ / -$___
- Monthly P&L impact: $_____
```

---

### Lever 5: Position Sizing Execution

```
POSITION SIZE THIS SPRINT: $_____ per trade

ACCURACY CHECK:
- Trades at correct size: ____ (✅)
- Trades at wrong size: ____ (❌)
- Accuracy: ___% (target: 100%)

IF ACCURACY < 100%:
Root causes of sizing errors:
- Manual entry error: ___ trades
- System miscalculation: ___ trades
- Capital constraint (account too small): ___ trades
- Other: ___ trades

CORRECTIVE ACTION:
☐ Double-check position size before every entry
☐ Implement pre-trade checklist (print and post)
☐ System needs debugging (detail: ________________)
☐ None needed (accuracy at 100%)

SCALING READINESS FOR NEXT SPRINT:
Current win rate: __% | Current account: $_____ | Current position size: $_____

Ready to scale up? (Check all conditions):
☐ Win rate ≥ 60% sustained this sprint
☐ Account balance > $_____ (threshold)
☐ Execution accuracy = 100%
☐ System health excellent (no errors/delays)

IF ALL YES:
Approved next position size: $_____ (+$___ per trade)

MONTHLY P&L IMPACT OF SCALING:
Current: $___/trade × ~4 trades/day × 20 days = $______/month
After scale: $___/trade × ~4 trades/day × 20 days = $______/month
Delta: +$______/month
```

---

## SECTION 3: INSTRUMENT WEIGHTING ANALYSIS

```
BTCUSD THIS SPRINT:
- Trades: ____ | Wins: ____ | Win%: ___% | P&L: $_______
- Volatility observed: (High / Medium / Low)
- FVG quality: (Sharp / Medium / Weak)
- Confidence: __/10
- Recommendation: (Keep equal / Increase weighting / Reduce weighting)

EURUSD THIS SPRINT:
- Trades: ____ | Wins: ____ | Win%: ___% | P&L: $_______
- Volatility observed: (High / Medium / Low)
- FVG quality: (Sharp / Medium / Weak)
- Confidence: __/10
- Recommendation: (Keep equal / Increase weighting / Reduce weighting)

COMPARISON:
Superior performer: (BTCUSD / EURUSD / Equal)
Win rate delta: ___% (higher minus lower)
Statistically significant? Y/N

WEIGHTING DECISION FOR NEXT SPRINT:
Current: 50% BTCUSD / 50% EURUSD
New: ___% BTCUSD / ___% EURUSD

EXPECTED IMPACT:
- Monthly trade count: _____ (vs. current _____)
- Monthly P&L: $_____ (vs. current $_____)
```

---

## SECTION 4: MARKET CONDITION ASSESSMENT

```
MARKET CHARACTERIZATION:
Overall trend (this sprint): (Trending / Consolidating / Choppy)

BTCUSD:
- Condition: (Trending up / Down / Consolidating)
- Volatility: (Increasing / Stable / Decreasing)
- FVG formations: (Sharp / Medium / Weak)
- Expected next sprint: (Stronger / Similar / Weaker)

EURUSD:
- Condition: (Trending up / Down / Consolidating)
- Volatility: (Increasing / Stable / Decreasing)
- FVG formations: (Sharp / Medium / Weak)
- Expected next sprint: (Stronger / Similar / Weaker)

MARKET-SPECIFIC ADJUSTMENTS FOR NEXT SPRINT:
If choppy market expected:
☐ Increase confluence threshold to 80/100 (fewer low-quality trades)
☐ Focus on peak window only (2pm-4pm ADL)
☐ Reduce position size to $300 (defensive positioning)
☐ Trade BTCUSD only (stronger volatility)
☐ Skip trading altogether (sit on sidelines)

If strong trending market expected:
☐ Maintain normal confluence threshold (70/100)
☐ Trade full hours (9am-10pm ADL)
☐ Maintain normal position size ($_____)
☐ Trade both BTCUSD and EURUSD equally
☐ Potentially increase position size (if ready)
```

---

## SECTION 5: SYSTEM HEALTH CHECK

```
WEBHOOK UPTIME (this sprint):
- Status: ___% (target: 99.5%+)
- Downtime incidents: ____ (detail: ________________)
- Impact: ____ trades missed

CAPITAL.COM CONNECTIVITY:
- Status: ___% (target: 99%+)
- Order rejection rate: __% (target: <1%)
- Slippage average: $_____ (target: <$30)

DATABASE LOGGING:
- All trades recorded: Y/N
- Any data loss: Y/N (if yes, detail: ____________)
- Performance: ___ms average query time

ALERT DELIVERY:
- ntfy.sh notifications received: __% (target: 100%)
- Notification latency: ___ms average (target: <5s)

SYSTEM SCORE: __/10

IF SCORE < 8/10:
Critical issues to address:
1. ___________________________
2. ___________________________
3. ___________________________

REMEDIATION PLAN:
- Issue 1: Action: _______________ | Timeline: ________
- Issue 2: Action: _______________ | Timeline: ________
- Issue 3: Action: _______________ | Timeline: ________
```

---

## SECTION 6: OPTIMIZATION ROADMAP PROGRESS

```
6-MONTH OPTIMIZATION PLAN STATUS:

Month 1 (June): Foundation ✅ / 🟡 / ❌
- Baseline performance established: Y/N
- System reliability validated: Y/N
- Daily discipline confirmed: Y/N
Progress: __% complete

Month 2 (July): Rest (Holiday) — In Progress / Upcoming
- Next milestone: Document Month 1 learnings

Month 3 (August): Stage 5 Optimization — Upcoming
- Target: +1.5% win rate (from 62% → 63.5%)
- Current progress: ___% toward target

Month 4 (September): Confluence Threshold — Upcoming
- Target: +2% win rate (from 63.5% → 65.5%)
- Current progress: ___% toward target

Month 5 (October): Rest + Planning — Upcoming
- Next: Prepare for final quarter push

Month 6 (November): Position Scaling — Upcoming
- Target: Scale to $475/trade
- Prerequisite: +3-5% cumulative win rate improvement

CUMULATIVE WIN RATE IMPROVEMENT TO DATE: +__% (target: +0.5-1.0% this sprint)
```

---

## SECTION 7: WEEKLY JOURNAL CORRELATION

```
LINKING TO WEEKLY JOURNALS (completed Sundays):

Weeks in this sprint:
- Week 1 (Sun ___): P&L $_____ | Win rate: __% | Key insight: __________
- Week 2 (Sun ___): P&L $_____ | Win rate: __% | Key insight: __________

SPRINT-LEVEL SYNTHESIS:
What were the top 3 insights across both weeks?
1. _________________________________
2. _________________________________
3. _________________________________

Which optimization lever made the biggest impact this sprint?
☐ Stage 5 trigger timing
☐ Confluence threshold
☐ Peak window focus
☐ R:R management
☐ Position sizing
☐ Instrument weighting
☐ Other: ____________________________

Why? ________________________________
```

---

## SECTION 8: DECISION GATE FOR NEXT SPRINT

```
READINESS CHECK (Check all or N/A):

✅ Win rate ≥60% this sprint? Y / N / N/A
✅ System reliability 99%+? Y / N / N/A
✅ Execution accuracy 100%? Y / N / N/A
✅ Capital account growing? Y / N / N/A

SPRINT VERDICT:
☐ 🟢 ON TRACK — Continue current strategy, apply optimizations
☐ 🟡 CAUTION — Some issues detected, minor adjustments needed
☐ 🔴 HOLD — Pause optimization, focus on core system health

NEXT SPRINT PRIORITIES (ranked):
1. _________________________________
2. _________________________________
3. _________________________________
```

---

## SECTION 9: ACTION ITEMS FOR NEXT SPRINT

```
FROM THIS REVIEW:

Priority 1 (Do immediately):
☐ Action: ___________________________ | Owner: _____ | Deadline: _____
☐ Action: ___________________________ | Owner: _____ | Deadline: _____

Priority 2 (This week):
☐ Action: ___________________________ | Owner: _____ | Deadline: _____
☐ Action: ___________________________ | Owner: _____ | Deadline: _____

Priority 3 (By next sprint):
☐ Action: ___________________________ | Owner: _____ | Deadline: _____
```

---

## SECTION 10: SIGN-OFF

```
Sprint completed: ___________
Reviewed by: ___________________
Time spent: _____ minutes (target: 45)

Next bi-weekly review: ___ weeks from now at Monday 19:00 ADL
Archive location: [GitHub / Notion / Local Drive]

Bi-weekly sprint file: BI-WEEKLY-SPRINT-[DATE-RANGE].md
```

---

**This bi-weekly sprint takes 45 minutes and keeps optimization levers aligned with weekly execution data.** 🎯  
**Every other Monday. Non-negotiable.**

Execute optimizations weekly → Measure results bi-weekly → Adjust monthly. 📈
