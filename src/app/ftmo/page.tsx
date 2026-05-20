import WikiLayout from "@/components/WikiLayout";

const propFirmRanking = [
  {
    rank: 1, firm: "FTMO", account: "$100k Swing", cost: "€540",
    profitTarget: "10% ($10,000)", dailyDD: "5% ($5,000)", maxDD: "10% ($10,000)", split: "80% → 90%",
    notes: "Exact instruments: XAUUSD, AUDUSD, EURUSD. No overnight/news restrictions on Swing. Fee refunded with first payout.",
    status: "DAY 1", statusColor: "text-amber-700 bg-amber-50 border-amber-200",
  },
  {
    rank: 2, firm: "FundedNext Futures Rapid", account: "$50k", cost: "$150",
    profitTarget: "8% ($4,000)", dailyDD: "None", maxDD: "5% ($2,500)", split: "90%",
    notes: "No daily DD limit — most forgiving for London-open momentum style. MGC, 6A, 6E futures — requires instrument adaptation.",
    status: "DAY 2", statusColor: "text-blue-700 bg-blue-50 border-blue-200",
  },
  {
    rank: 3, firm: "Lucid Trading", account: "$100k", cost: "~$500",
    profitTarget: "10%", dailyDD: "None", maxDD: "10%", split: "90%",
    notes: "No daily DD limit. Spot CFDs available — verify XAUUSD before applying.",
    status: "BACKUP", statusColor: "text-slate-600 bg-slate-100 border-slate-300",
  },
];

const hardStops = [
  { label: "Personal daily limit",   real: "$1,600", shadow: "$2,000",  action: "Stop. Platform closes. No re-entry today.",      type: "personal" },
  { label: "Prop Firm soft daily buffer", real: "$3,200", shadow: "$4,000",  action: "Reduce to T1 only. High alert.",                 type: "soft" },
  { label: "Prop Firm 5% daily DD",       real: "$4,000", shadow: "$5,000",  action: "TERMINAL HALT. No new entries until next ACST session.", type: "hard" },
  { label: "Prop Firm soft max buffer",   real: "$7,200", shadow: "$9,000",  action: "T1 only. Review session. Stop if stressed.",      type: "soft" },
  { label: "Prop Firm 10% max DD",        real: "$8,000", shadow: "$10,000", action: "CHALLENGE OVER. Liquidate all positions. 48-hr review.", type: "hard" },
];

const passCriteria = [
  "Shadow P&L reached +$10,000 (10% profit target)",
  "No single day lost more than $5,000 shadow (5% daily limit)",
  "Max drawdown never exceeded $10,000 shadow (10% of $100k)",
  "Traded at least 4 different days",
  "Psychology score 3+ on ALL entry days",
  "Entry checklist completed 100% of entry days",
];

export default function FtmoPage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Prop Firm</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Prop Firm Plan</h1>
        <p className="text-sm text-slate-500 mt-1">Shadow challenge · Hard stops · Multi-account strategy · Firm rankings</p>
      </div>

      {/* Shadow Tracker */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Prop Firm Shadow Challenge</h2>
          <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5">⏳ IN PROGRESS</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Starting balance", value: "$100,000", sub: "Simulated Prop Firm" },
            { label: "Profit target",    value: "$10,000",  sub: "10% — Phase 1 pass" },
            { label: "Daily DD limit",   value: "$5,000",   sub: "5% shadow max" },
            { label: "Max drawdown",     value: "$10,000",  sub: "10% = challenge over" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-base font-bold font-mono text-slate-800 mt-1">{s.value}</p>
              <p className="text-[11px] text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Running Totals</p>
            <div className="space-y-2">
              {[
                { label: "Shadow P&L to date",    value: "$0",              color: "text-slate-800" },
                { label: "Shadow balance",        value: "$100,000",        color: "text-slate-800" },
                { label: "P&L vs target",         value: "$0 / $10,000",    color: "text-slate-500" },
                { label: "Max drawdown reached",  value: "$0 (limit $10k)", color: "text-emerald-600" },
                { label: "Days traded",           value: "0 (min: 4)",      color: "text-slate-500" },
                { label: "Started",               value: "April 21, 2026",  color: "text-slate-500" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-mono font-semibold ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Scale Factor</p>
            <div className="text-center py-3">
              <p className="text-3xl font-bold font-mono text-amber-600">1.25×</p>
              <p className="text-xs text-slate-500 mt-1">Real P&L × 1.25 = Shadow P&L</p>
            </div>
            <div className="space-y-1.5 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between"><span className="text-slate-500">Real account</span><span className="font-mono font-bold text-slate-700">$80,000</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Prop Firm equivalent</span><span className="font-mono font-bold text-slate-700">$100,000</span></div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Example: Real +$400</span>
                <span className="text-emerald-600 font-mono font-bold">Shadow +$500</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">Update after every session:</p>
          <ol className="space-y-1 text-xs text-slate-600">
            <li>1. Note real P&L from post-session log</li>
            <li>2. Real P&L × 1.25 = shadow P&L</li>
            <li>3. Update shadow balance (previous ± shadow P&L)</li>
            <li>4. Update max drawdown if today was a new low</li>
            <li>5. Update status: ✅ PASSING / ⚠️ CAUTION / ❌ FAILED</li>
          </ol>
        </div>
      </div>

      {/* Hard Stops */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Hard Stops — Prop Firm Protection</h2>
        <div className="space-y-2">
          {hardStops.map((stop) => (
            <div key={stop.label} className={`flex items-start gap-4 p-4 rounded-lg border
              ${stop.type === "hard" ? "bg-red-50 border-red-200" :
                stop.type === "soft" ? "bg-amber-50 border-amber-200" :
                "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 uppercase border flex-shrink-0 mt-0.5
                ${stop.type === "hard" ? "text-red-700 bg-red-100 border-red-300" :
                  stop.type === "soft" ? "text-amber-700 bg-amber-100 border-amber-300" :
                  "text-slate-600 bg-slate-200 border-slate-300"}`}>
                {stop.type === "hard" ? "HARD" : stop.type === "soft" ? "SOFT" : "PERSONAL"}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{stop.label}</p>
                <p className={`text-xs mt-0.5 font-mono font-bold ${stop.type === "hard" ? "text-red-600" : "text-amber-600"}`}>
                  Real: {stop.real} · Shadow: {stop.shadow}
                </p>
                <p className="text-xs text-slate-500 mt-1">{stop.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ★ NEW: Multi-Account / Daisy-Chain Strategy */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-3 mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Multi-Account Strategy — Daisy-Chain Approach</h2>
            <p className="text-xs text-slate-400 mt-1">Run challenges slowly and at reduced risk. Preserve capital across multiple funded accounts.</p>
          </div>
        </div>

        {/* Core philosophy */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            <span className="text-emerald-700 font-semibold">The principle:</span> Rather than risk a full lot on one account, run two accounts at half risk each. Neither account individually faces the same drawdown exposure — Prop Firms evaluate each separately. If one session goes wrong, it can only hurt one account, not both.
          </p>
        </div>

        {/* Phase progression */}
        <div className="space-y-3 mb-5">
          {[
            {
              phase: "Phase 1",
              title: "Run Challenge 1 at reduced risk",
              color: "border-l-blue-400",
              badge: "text-blue-700 bg-blue-50 border-blue-200",
              points: [
                "Use T1 and T2 only — no T3/T4 during the challenge period",
                "Target is to PASS, not to maximise profit. Slow and clean wins.",
                "Daily loss target: stay under $800 real ($1,000 shadow) per session",
                "Treat it as a 90-day demonstration of discipline, not a sprint",
              ],
            },
            {
              phase: "Phase 2",
              title: "First account funded — build track record",
              color: "border-l-amber-400",
              badge: "text-amber-700 bg-amber-50 border-amber-200",
              points: [
                "Continue trading T1/T2 on funded Account 1",
                "Do not scale up yet — prove consistency for 30–60 days",
                "Accumulate payout history and process evidence",
                "Simultaneously begin Challenge 2 at same reduced risk",
              ],
            },
            {
              phase: "Phase 3",
              title: "Both accounts funded — split-lot execution",
              color: "border-l-emerald-400",
              badge: "text-emerald-700 bg-emerald-50 border-emerald-200",
              points: [
                "Same total lot size split across two accounts",
                "If normal T2 = 0.50 lots → run 0.25 lots on Account 1 and 0.25 on Account 2",
                "Each account sees $200 risk per trade instead of $400 on one account",
                "A failed trade affects each account by $200, not $400 — harder to breach individual DD limits",
                "A stalled or timed-out trade costs less per account individually",
              ],
            },
          ].map((p) => (
            <div key={p.phase} className={`p-4 bg-slate-50 rounded-lg border border-slate-200 border-l-4 ${p.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${p.badge}`}>{p.phase}</span>
                <p className="text-sm font-semibold text-slate-800">{p.title}</p>
              </div>
              <ul className="space-y-1">
                {p.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="text-slate-300 flex-shrink-0 mt-0.5">–</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Risk math */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Risk Comparison</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="text-left pb-2">Scenario</th>
                  <th className="text-right pb-2">Lots</th>
                  <th className="text-right pb-2">Risk / trade</th>
                  <th className="text-right pb-2">DD impact per account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-slate-700 font-medium">Standard (1 account)</td>
                  <td className="text-right font-mono text-slate-600">0.50</td>
                  <td className="text-right font-mono text-red-600">$400</td>
                  <td className="text-right font-mono text-red-600">$400</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 font-medium">Daisy-chain (2 accounts)</td>
                  <td className="text-right font-mono text-slate-600">0.25 + 0.25</td>
                  <td className="text-right font-mono text-emerald-600">$400 total</td>
                  <td className="text-right font-mono text-emerald-600">$200 each</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 font-medium">Conservative (1 account)</td>
                  <td className="text-right font-mono text-slate-600">0.25</td>
                  <td className="text-right font-mono text-blue-600">$200</td>
                  <td className="text-right font-mono text-blue-600">$200</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-2">✓ Advantages</p>
            <ul className="space-y-1 text-xs text-slate-600">
              <li>– Each account individually harder to blow</li>
              <li>– Prop Firms evaluate accounts separately</li>
              <li>– Psychological: less fear per individual account</li>
              <li>– A bad session can only damage one account</li>
              <li>– Scales profit split over time (80% × 2 accounts)</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-700 mb-2">⚠ Considerations</p>
            <ul className="space-y-1 text-xs text-slate-600">
              <li>– Requires passing 2 separate challenges</li>
              <li>– 2× the fees (~€1,080 for 2× $100k)</li>
              <li>– Managing 2 platforms simultaneously</li>
              <li>– Do not attempt Phase 3 until both funded</li>
              <li>– Start Phase 1 before committing to Phase 3</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pass Criteria */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-1">Pass Criteria Checklist</h2>
        <p className="text-xs text-slate-400 mb-4">Review after 90 trading days. All 6 must be checked before attempting the real Prop Firm challenge.</p>
        <div className="space-y-0">
          {passCriteria.map((c, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <div className="w-4 h-4 rounded border border-slate-300 bg-slate-50 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600">{c}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs text-slate-600">
            <span className="text-emerald-700 font-semibold">Green light:</span> All 6 checked → schedule the real Prop Firm $100k Swing (~€540, refunded with first payout).
          </p>
        </div>
      </div>

      {/* Prop Firm Rankings */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Prop Firm Rankings</h2>
        <div className="space-y-4">
          {propFirmRanking.map((firm) => (
            <div key={firm.rank} className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-slate-300 font-mono">#{firm.rank}</span>
                  <div>
                    <p className="text-base font-bold text-slate-800">{firm.firm}</p>
                    <p className="text-xs text-slate-400">{firm.account}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold rounded px-2 py-0.5 border ${firm.statusColor}`}>{firm.status}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                <div><p className="text-[10px] text-slate-400 uppercase">Cost</p><p className="font-mono font-bold text-slate-700">{firm.cost}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase">Target</p><p className="font-mono font-bold text-slate-700">{firm.profitTarget}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase">Daily DD</p><p className="font-mono font-bold text-slate-700">{firm.dailyDD}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase">Split</p><p className="font-mono font-bold text-slate-700">{firm.split}</p></div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{firm.notes}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
          <p className="font-semibold text-slate-600 uppercase tracking-wider text-[10px]">Decision Framework</p>
          <div className="flex items-start gap-2"><span className="text-amber-600 font-bold flex-shrink-0">Day 1:</span><span className="text-slate-500">Prop Firm Swing $100k. Shadow challenge passes consistently → apply. Run at reduced risk (Phase 1).</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-600 font-bold flex-shrink-0">Day 2:</span><span className="text-slate-500">FundedNext Futures $50k. After Prop Firm funded, or parallel to build daisy-chain.</span></div>
        </div>
      </div>
    </WikiLayout>
  );
}
