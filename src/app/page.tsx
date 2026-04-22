import WikiLayout from "@/components/WikiLayout";
import Link from "next/link";

const todayChecklist = [
  { id: 1, label: "Watch morning video — write Scenario 1 bias", field: "Pair / direction / BASE level" },
  { id: 2, label: "Write bias invalidation line on chart", field: "e.g. Scenario 1 OFF if GOLD closes below ___" },
  { id: 3, label: "Check economic calendar for news events", field: "Mark any 15:00–17:00 ACST events" },
  { id: 4, label: "Wednesday check — A+ only, T2 max if applicable", field: "Default = wait unless perfect setup" },
  { id: 5, label: "15:00 check — run signal check", field: "5 conditions + spread + Scenario 1" },
  { id: 6, label: "Post-session log — complete within 10 mins", field: "Process score + psych score + one lesson" },
  { id: 7, label: "Update FTMO shadow tracker", field: "Real P&L × 1.25 = shadow P&L" },
];

const quickStats = [
  { label: "Account balance", value: "$80,000", sub: "Capital.com", color: "text-slate-800" },
  { label: "Daily loss limit", value: "$1,600", sub: "2% personal stop", color: "text-amber-600" },
  { label: "FTMO daily hard stop", value: "$4,000", sub: "5% — terminal halt", color: "text-red-600" },
  { label: "FTMO max drawdown", value: "$8,000", sub: "10% — challenge over", color: "text-red-600" },
];

export default function DashboardPage() {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-AU", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const isWednesday = today.getDay() === 3;

  return (
    <WikiLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{dayName}</span>
          {isWednesday && (
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
              ⚠ Wednesday — A+ only
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{dateStr}</h1>
        <p className="text-sm text-slate-500 mt-1">Trading Operations Dashboard</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickStats.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Today's Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Today&apos;s Daily Agenda</h2>
          <span className="text-[10px] text-slate-400">Complete in order</span>
        </div>
        <div className="space-y-1">
          {todayChecklist.map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <div className="mt-0.5 w-5 h-5 rounded border border-slate-300 bg-slate-50 flex items-center justify-center flex-shrink-0 text-[10px] text-slate-500 font-mono font-bold">
                {item.id}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-800 font-medium">{item.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.field}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Non-negotiables */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Non-Negotiable Rules</h2>
          <ul className="space-y-2">
            {[
              "Entry ONLY between 15:30–17:00 ACST",
              "All 5 conditions must be met — no exceptions",
              "Scenario 1 confirmed in morning video",
              "News calendar checked before entry",
              "Spread checked — factored into SL",
              "Max 2 losses per session — then STOP",
              "Wednesday: A+ only, T2 max (no T3/T4)",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5 flex-shrink-0 font-bold">–</span>
                <span className="text-slate-600">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 5-Condition Gate */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">5-Condition Entry Gate</h2>
          <div className="space-y-2">
            {[
              { n: "C1", label: "VWAP bounce",          detail: "Price reclaiming VWAP from below" },
              { n: "C2", label: "RSI 40–60",             detail: "Momentum zone — not overbought" },
              { n: "C3", label: "EMA10 > EMA21",         detail: "Short-term trend aligned" },
              { n: "C4", label: "Price > EMA20",         detail: "Above 20-period moving average" },
              { n: "C5", label: "Scenario 1 confirmed",  detail: "Morning video bias active" },
            ].map((c) => (
              <div key={c.n} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-0.5 flex-shrink-0">
                  {c.n}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.label}</p>
                  <p className="text-[11px] text-slate-500">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-[11px] text-slate-600">
              <span className="text-amber-700 font-semibold">ALL 5 must be met.</span> One missing = no trade. No discretion.
            </p>
          </div>
        </div>
      </div>

      {/* FTMO Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">FTMO Shadow Tracker</h2>
          <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5">⏳ IN PROGRESS</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Shadow P&L", value: "$0", sub: "of $10,000 target", color: "text-slate-800" },
            { label: "Max Drawdown", value: "$0", sub: "limit: $10,000", color: "text-emerald-600" },
            { label: "Days Traded",  value: "0",  sub: "minimum: 4",      color: "text-slate-800" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <p className="text-[11px] text-slate-500">
            Scale factor: <span className="text-amber-600 font-mono font-bold">1.25×</span> — Real P&L × 1.25 = Shadow P&L. Update after every session.
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/rules",      label: "Trading Rules", icon: "◎" },
          { href: "/ftmo",       label: "FTMO Plan",     icon: "◈" },
          { href: "/psychology", label: "Psychology",    icon: "◉" },
          { href: "/goals",      label: "Goals",         icon: "◇" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md rounded-xl p-4 transition-all group shadow-sm"
          >
            <span className="text-lg text-slate-400 group-hover:text-amber-500 transition-colors">{link.icon}</span>
            <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 mt-2 transition-colors">{link.label}</p>
          </Link>
        ))}
      </div>
    </WikiLayout>
  );
}
