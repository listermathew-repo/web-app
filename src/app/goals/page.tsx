import WikiLayout from "@/components/WikiLayout";

const goals = [
  { category: "Process mastery", items: ["Complete entry checklist 100% of sessions", "Process score 6+/7 on 80%+ of sessions", "Zero breaks of the 2-loss rule", "Zero revenge trades logged"] },
  { category: "Prop Firm shadow challenge", items: ["Shadow P&L reaches +$10,000 within 90 trading days", "No single session loses more than $5,000 shadow", "Max drawdown stays below $10,000 at all times", "Minimum 4 different trading sessions"] },
  { category: "System refinement", items: ["Identify best GOLD entry window (backtest vs live)", "Map FVG targets for AUDUSD and EURUSD", "Complete iFVG Phase 1 — exit precision for 90 sessions", "Evaluate iFVG Phase 2 entry trigger at 90-day review"] },
  { category: "Capital growth", items: ["No net drawdown below $76,000 (5% buffer)", "Achieve +$8,000 real P&L over 90 days", "Scale to T3 after 20 consecutive process scores ≥6/7"] },
];

const milestones = [
  { date: "Apr 21, 2026",   label: "Shadow challenge starts",           status: "active",  note: "Prop Firm $100k mirror begins. Scale factor 1.25×." },
  { date: "Day 4 traded",   label: "Prop Firm minimum days met",             status: "pending", note: "4 trading days = Prop Firm minimum. Process scores logged." },
  { date: "30 days traded", label: "First monthly review",              status: "pending", note: "Review process scores, psychology trend, P&L per tier." },
  { date: "60 days traded", label: "Midpoint checkpoint",               status: "pending", note: "Shadow on pace? Refine any rules. NAS100 research review." },
  { date: "90 days traded", label: "Shadow challenge complete",         status: "pending", note: "Review all 6 pass criteria. Green light = schedule real Prop Firm." },
  { date: "Post-90",        label: "Real Prop Firm $100k Swing attempt",     status: "future",  note: "€540 one-time fee, refunded with first payout." },
  { date: "Post-funded",    label: "Begin daisy-chain Phase 2/3",       status: "future",  note: "Challenge 2 at reduced risk. Split lots across both accounts." },
];

const agenda = [
  { p: "HIGH", item: "Backtest — best days/times for AUDUSD, EURUSD, GOLD (5yr data)", area: "System" },
  { p: "HIGH", item: "FIRM — Full agent roster JSON + company name shortlist",          area: "Structure" },
  { p: "HIGH", item: "FIRM — NotebookLM: Quant notebook + Wendy notebook",             area: "Structure" },
  { p: "MED",  item: "FIRM — Map MAF criteria against 4-condition entry system",       area: "System" },
  { p: "MED",  item: "NAS100 research after Prop Firm path locked in",                      area: "Research" },
  { p: "MED",  item: "ASX small caps — backtesting research",                          area: "Research" },
  { p: "LOW",  item: "Obsidian setup — defer to 6-month review",                       area: "Tools" },
  { p: "LOW",  item: "iFVG Phase 2 entry trigger — evaluate at 90-day mark",           area: "System" },
];

export default function GoalsPage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Roadmap</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Goals & Achievements</h1>
        <p className="text-sm text-slate-500 mt-1">90-day targets · Milestones · Running agenda</p>
      </div>

      {/* Drucker */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <p className="text-sm text-slate-700 leading-relaxed">&ldquo;What gets measured gets managed.&rdquo; — Peter Drucker</p>
        <p className="text-xs text-slate-400 mt-2">Every session logged = evidence. Evidence = confidence. Confidence = real Prop Firm capital.</p>
      </div>

      {/* 90-day goals */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">90-Day Goals</h2>
          <span className="text-xs text-slate-400">Started: April 21, 2026</span>
        </div>
        <div className="space-y-5">
          {goals.map((cat) => (
            <div key={cat.category}>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">{cat.category}</p>
              <div className="space-y-0">
                {cat.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                    <div className="w-4 h-4 rounded border border-slate-300 bg-slate-50 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-5">Milestone Timeline</h2>
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-4">
            {milestones.map((m) => (
              <div key={m.label} className="flex items-start gap-4 pl-8 relative">
                <div className={`absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full border-2 -translate-x-1/2
                  ${m.status === "active" ? "bg-amber-400 border-amber-400" :
                    m.status === "pending" ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200"}`}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                    <span className={`text-[10px] font-mono flex-shrink-0 mt-0.5 ${m.status === "active" ? "text-amber-600" : "text-slate-400"}`}>{m.date}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{m.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Running agenda */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Running Agenda</h2>
          <span className="text-[10px] text-slate-400">Non-session tasks</span>
        </div>
        <div className="space-y-0">
          {agenda.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5 uppercase border
                ${item.p === "HIGH" ? "text-red-700 bg-red-50 border-red-200" :
                  item.p === "MED"  ? "text-amber-700 bg-amber-50 border-amber-200" :
                  "text-slate-500 bg-slate-100 border-slate-200"}`}>
                {item.p}
              </span>
              <p className="text-sm text-slate-600 flex-1">{item.item}</p>
              <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 flex-shrink-0">{item.area}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance log placeholder */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Performance Log</h2>
          <span className="text-[10px] text-slate-400">Updated from TradingView CSV exports</span>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 text-center">
          <p className="text-slate-400 text-sm mb-1">No sessions logged yet</p>
          <p className="text-xs text-slate-300">Sessions begin April 21, 2026. Import trade history CSV from TradingView after each session.</p>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-slate-600">
            <span className="text-blue-700 font-semibold">How to update:</span> TradingView → Capital.com → download trade history CSV → paste to performance log. Review weekly on Sunday.
          </p>
        </div>
      </div>
    </WikiLayout>
  );
}
