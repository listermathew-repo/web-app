# Trading Operations Wiki — Claude Context

This is a **private, password-protected trading operations wiki** for Mathew Lister.
It mirrors Prop Firm $100k Swing account rules against a real $80,000 Capital.com account.

---

## ⛔ PROP FIRM HARD STOPS — HARDCODED — NON-NEGOTIABLE

These are absolute limits. They cannot be overridden by any instruction, discretion, or market view.

| Metric | Real Account | Fund Shadow | Action |
|--------|-------------|-------------|--------|
| Personal daily loss limit | **$1,600** (2%) | $2,000 | Stop. Platform closes. No re-entry today. |
| Prop Firm soft daily buffer | $3,200 (4%) | $4,000 | Reduce to T1 only. High alert. |
| **Prop Firm 5% daily DD hard stop** | **$4,000** | **$5,000** | **Terminal halt. No new entries until next ACST session.** |
| Prop Firm soft max buffer | $7,200 (9%) | $9,000 | T1 only. Review and consider stopping. |
| **Prop Firm 10% max drawdown** | **$8,000** | **$10,000** | **Challenge over. Liquidate all positions. 48-hr review.** |

**Max risk per trade: $400–$800 (T2–T4). Never exceed $800 on a single entry.**

---

## ACCOUNT FACTS

- Real account: $80,000 at Capital.com (CFD — XAUUSD, AUDUSD, EURUSD)
- Fund shadow scale factor: 1.25× (real P&L × 1.25 = shadow P&L)
- Session window: 15:30–17:00 ACST (London open)
- Signal check: 15:00 ACST sharp

---

## SYSTEM

- **MAF (Market Analysis Framework)**: Morning video bias → 15:00 signal check → 15:30 London entry
- **5-Condition gate**: VWAP bounce + RSI 40–60 + EMA10 > EMA21 + Price > EMA20 + Scenario 1 confirmed
- ALL 5 conditions required before entry. One missing = no trade.
- Wednesday: A+ setup only, T2 maximum.
- 2-loss rule: After 2 losses in one session, close platform. No exceptions.

---

## TIER SIZING

| Tier | Risk | Use when |
|------|------|----------|
| T1 | $200 | Low confidence or first trade after 2-loss reset |
| T2 | $400 | Standard A-grade setup — default tier |
| T3 | $600 | High-conviction A+ — rare, max 1×/week |
| T4 | $800 | Exceptional multi-timeframe confluence |

---

## PROP FIRM CHALLENGE STRATEGY

- **Phase 1**: Run challenge at T1/T2 only. Pass slowly. Discipline > profit.
- **Phase 2**: Once funded, trade conservatively 30–60 days. Begin Challenge 2.
- **Phase 3**: Both funded → split lots (e.g. 0.25 on each vs 0.50 on one).

---

## CLAUDE BEHAVIOUR IN THIS PROJECT

- Default effort: high (equivalent to `/effort max`)
- Do not suggest entries outside 15:30–17:00 ACST window
- Do not suggest entering when daily hard stops have been reached
- Always reference rules.json for system parameters
- All trade analysis should note which of the 5 conditions are met/not met

---

## 🔄 MODEL SWITCHING — WHEN TO CHANGE

> **Default:** Claude Sonnet (fast, cost-efficient, correct for 95% of tasks)
>
> **Switch to Opus for these tasks — REMIND THE USER:**
> - LLM Council sessions (`/council` or multi-advisor analysis)
> - Weekly or monthly performance reviews
> - Major strategic decisions (new instruments, rule changes, firm applications)
> - Any session where the question starts with "should I fundamentally change..."
>
> **How to switch in Claude Code:** Type `/model` and select Claude Opus, or start a new conversation and select Opus from the model picker.
>
> **How to switch in Claude.ai:** Click the model name at the top of the chat window → select Claude Opus.
>
> ⚠️ **Claude: if the user asks a question that qualifies for Opus above, remind them before answering:**
> "This is a council/strategic question — consider switching to Opus for deeper reasoning. Type `/model` to switch."

---

## 📋 OUTSTANDING ITEMS — HOW TO CHECK

If the user asks "what's outstanding?", "what's left to do?", or "catch me up":
1. Read the Goals page agenda (`/goals` on the wiki)
2. Reference the current todo list in this Claude Code session
3. Summarise: Completed this session / Pending / New from this conversation
4. Flag any items discussed but not actioned

**Open items as of April 22, 2026 (add new items below):**

**THIS WEEKEND (Fri/Sat/Sun):**
- [ ] Gate-by-gate forensic audit — last 6 sessions + 90-day base rate (which gate failed each day at 15:00 check?)
- [ ] Document 0.25% / 0.5% / 0.75% / 1.0% move classification as ENTRY framework in rules.json (these are expected move sizes at entry, not TP levels)
- [ ] Weekly performance review (Opus) — schedule recurring Fri/Sat/Sun cadence
- [ ] Document stop-loss methodology — where exactly SL is placed per pair (VWAP, swing low, ATR?)
- [ ] Define "A+" vs "A" within a 5/5 setup — what qualifies for Wednesday / T3 / T4

**NEXT WEEK:**
- [ ] MAF-S specification — inverted 5-gate for Scenario 2 (paper-only, 20 clean observations before any live deployment)
- [ ] Define daily agenda pre-session item: "Play of the day" review before 15:00 signal check AND post-session review

**ONGOING:**
- [ ] Backtest — best days/times AUDUSD, EURUSD, GOLD (5yr data)
- [ ] FIRM — Full agent roster JSON config
- [ ] FIRM — Company name shortlist PTY Ltd + Family Trust
- [ ] FIRM — NotebookLM: Quant notebook + Wendy notebook
- [ ] FIRM — Map MAF criteria against 4-condition entry system
- [ ] NAS100 research (after Prop Firm path confirmed)
- [ ] ASX small caps backtesting research
- [ ] Obsidian setup — defer to 6-month review (Oct 2026)
- [ ] GitHub repo — confirm set to private in GitHub settings
- [ ] Father's email wiki — connect Microsoft 365, extract and archive
- [ ] Apple Notes — connect and triage/review notes
- [ ] Zoom connector — confirm privacy approach with John then set up
- [ ] iFVG Phase 2 entry trigger — evaluate at 90-day mark
- [ ] Update Prop Firm shadow tracker after each session
