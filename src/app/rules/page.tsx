import WikiLayout from "@/components/WikiLayout";

const tiers = [
  { tier: "T1", risk: "$200", lots: "0.2 lots GOLD / 0.3 lots FX", context: "Low confidence. Marginal setup. First trade of new account or after 2 losses." },
  { tier: "T2", risk: "$400", lots: "0.4 lots GOLD / 0.5 lots FX", context: "Standard A-grade setup. All 5 conditions met. Default tier." },
  { tier: "T3", risk: "$600", lots: "0.6 lots GOLD / 0.8 lots FX", context: "High-conviction A+ setup. Rare — max 1×/week. Not on Wednesdays." },
  { tier: "T4", risk: "$800", lots: "0.8 lots GOLD / 1.0 lots FX", context: "Exceptional. Multi-timeframe confluence. Requires written justification." },
];

const riskRules = [
  { rule: "Personal daily limit",     value: "$1,600 (2% of $80k)",      note: "Hit this = stop. Platform closes. No re-entry today." },
  { rule: "FTMO daily hard stop",     value: "$4,000 (5% shadow)",        note: "Terminal halt regardless of setup quality." },
  { rule: "FTMO max drawdown",        value: "$8,000 (10% shadow)",       note: "Challenge over if breached. Soft buffer at $7,200." },
  { rule: "2-loss rule",              value: "2 losses in one session",   note: "Close platform immediately. No discussion." },
  { rule: "Wednesday max tier",       value: "T2 only — A+ required",     note: "No T3/T4 on Wednesdays." },
  { rule: "BE rule",                  value: "Move SL to BE at +1R",      note: "Apply when price reaches 1R from entry." },
  { rule: "Exit discipline",          value: "Target or SL — no choices", note: "Do not move targets. Do not widen SLs." },
];

const instruments = [
  { pair: "XAUUSD (Gold)", sl: "15–25 pts", lev: "1:20", margin: "~A$8,974", note: "Primary instrument. Highest volatility at London open." },
  { pair: "AUDUSD",        sl: "10–15 pips", lev: "1:30", margin: "~A$8,891", note: "Most margin-efficient. AUD-denominated advantage." },
  { pair: "EURUSD",        sl: "10–15 pips", lev: "1:30", margin: "~A$14,598", note: "Higher margin — EUR price ~64% above AUD." },
];

export default function RulesPage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reference</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Trading Rules</h1>
        <p className="text-sm text-slate-500 mt-1">MAF system · Entry conditions · Risk management · Tier sizing</p>
      </div>

      {/* MAF System */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">MAF System — Market Analysis Framework</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {[
            { step: "Step 1", label: "Morning Video",  detail: "Watch MAF video before 14:00 ACST. Write Scenario 1 bias, BASE level, and invalidation line." },
            { step: "Step 2", label: "Signal Check",   detail: "At 15:00 ACST sharp — run all 5 conditions against live chart. No early or late entries." },
            { step: "Step 3", label: "London Entry",   detail: "Entry only 15:30–17:00 ACST. Conditions still green. Tier chosen BEFORE opening position." },
          ].map((s) => (
            <div key={s.step} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">{s.step}</span>
              <p className="text-sm font-semibold text-slate-800 mt-2 mb-1">{s.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs text-slate-600">
            <span className="text-amber-700 font-semibold">Bias invalidation format:</span> &ldquo;Scenario 1 is OFF if [PAIR] closes [above/below] [LEVEL]&rdquo;.
            Write on TradingView chart AND entry checklist before 15:00. The written line is the authority — not your opinion in the moment.
          </p>
        </div>
      </div>

      {/* 5-Condition Gate */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-1">5-Condition Entry Gate</h2>
        <p className="text-xs text-slate-400 mb-4">ALL conditions required. One missing = no trade.</p>
        <div className="space-y-2">
          {[
            { n: "C1", label: "VWAP bounce",          detail: "Price reclaiming VWAP from below. Clean rejection or reclaim — not just a touch.",  gate: "Filters noise" },
            { n: "C2", label: "RSI 40–60",             detail: "Momentum zone. Not overbought (>70), not oversold (<30). Reset after flush.",         gate: "Avoids chasing" },
            { n: "C3", label: "EMA10 > EMA21",         detail: "Short-term trend aligned bullish. EMA10 crossing above or staying above EMA21.",      gate: "Trend confirmation" },
            { n: "C4", label: "Price > EMA20",         detail: "Price trading above the 20-period EMA. Bullish structure intact.",                     gate: "Structure filter" },
            { n: "C5", label: "Scenario 1 confirmed",  detail: "Morning video has identified and confirmed the long bias for this pair today.",         gate: "Direction authority" },
          ].map((c) => (
            <div key={c.n} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex-shrink-0 mt-0.5">{c.n}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{c.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.detail}</p>
              </div>
              <span className="text-[10px] text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 flex-shrink-0 whitespace-nowrap">{c.gate}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">
            <span className="font-semibold">Gate 6 — Spread:</span> Factor spread into SL before placing the order. Unacceptable R:R after spread = pass on the trade.
          </p>
        </div>
      </div>

      {/* Tier Sizing */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-1">Tier Sizing System</h2>
        <p className="text-xs text-slate-400 mb-4">Tier chosen BEFORE entry. Reflects setup quality, not anticipated profit.</p>
        <div className="space-y-2">
          {tiers.map((t) => (
            <div key={t.tier} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-center flex-shrink-0 w-12">
                <span className="text-sm font-bold font-mono text-slate-800">{t.tier}</span>
                <p className="text-[11px] font-mono font-bold text-emerald-600 mt-0.5">{t.risk}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs font-mono text-slate-500 mb-0.5">{t.lots}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{t.context}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-slate-600">
            <span className="text-amber-700 font-semibold">Wednesday:</span> T2 maximum. A+ setup required. No T3/T4 regardless of setup quality.
          </p>
        </div>
      </div>

      {/* Risk Rules */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Risk Rules</h2>
        <div className="space-y-0">
          {riskRules.map((r) => (
            <div key={r.rule} className="flex items-start gap-4 py-3 border-b border-slate-100 last:border-0">
              <div className="flex-shrink-0 w-48">
                <p className="text-xs font-semibold text-slate-800">{r.rule}</p>
                <p className="text-[11px] font-mono font-bold text-amber-600 mt-0.5">{r.value}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{r.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Instruments */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-1">Instruments & Margin Reference</h2>
        <p className="text-xs text-slate-400 mb-4">Margin is collateral locked from account balance during the trade. No additional deposit required.</p>
        <div className="space-y-3">
          {instruments.map((inst) => (
            <div key={inst.pair} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-sm font-semibold text-slate-800">{inst.pair}</p>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">T2 margin ($400 risk)</p>
                  <p className="text-sm font-mono font-bold text-amber-600">{inst.margin}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div><p className="text-[10px] text-slate-400 uppercase">Typical SL</p><p className="text-xs font-mono text-slate-600">{inst.sl}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase">Leverage</p><p className="text-xs font-mono text-slate-600">{inst.lev}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase">Session</p><p className="text-xs text-slate-600">15:30 ACST</p></div>
              </div>
              <p className="text-xs text-slate-400">{inst.note}</p>
            </div>
          ))}
        </div>
      </div>
    </WikiLayout>
  );
}
