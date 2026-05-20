import WikiLayout from "@/components/WikiLayout";

const februaryData = {
  summary: {
    totalTrades: 28,
    winRate: 64.3,
    profitLoss: 2156.30,
    roi: 21.6,
    maxDrawdown: 425,
    avgTradeSize: 77.01,
    avgRPerTrade: 0.44,
  },
  weeks: [
    {
      week: "Week 1 (Feb 1–7)",
      trades: 6,
      wins: 4,
      losses: 2,
      pnl: 487.50,
      note: "Strong start. High volatility early week.",
    },
    {
      week: "Week 2 (Feb 8–14)",
      trades: 7,
      wins: 5,
      losses: 2,
      pnl: 642.80,
      note: "Best week. Tight SL discipline on all A-grade setups.",
    },
    {
      week: "Week 3 (Feb 15–21)",
      trades: 8,
      wins: 5,
      losses: 3,
      pnl: 521.15,
      note: "Mid-month volatility. One max drawdown event recovered from.",
    },
    {
      week: "Week 4 (Feb 22–28)",
      trades: 7,
      wins: 4,
      losses: 3,
      pnl: 504.85,
      note: "Consistent but slower. Month-end position building.",
    },
  ],
  topWins: [
    {
      rank: 1,
      symbol: "GOLD",
      entry: 2078.50,
      exit: 2106.25,
      pnl: 623.40,
      r: 2.1,
      quality: "A+",
      date: "Feb 12",
    },
    {
      rank: 2,
      symbol: "AUDUSD",
      entry: 0.6847,
      exit: 0.6918,
      pnl: 452.15,
      r: 1.8,
      quality: "A",
      date: "Feb 8",
    },
    {
      rank: 3,
      symbol: "EURUSD",
      entry: 1.0921,
      exit: 1.0958,
      pnl: 381.20,
      r: 1.5,
      quality: "A",
      date: "Feb 19",
    },
    {
      rank: 4,
      symbol: "GOLD",
      entry: 2091.10,
      exit: 2112.85,
      pnl: 354.80,
      r: 1.3,
      quality: "A",
      date: "Feb 25",
    },
  ],
  topLosses: [
    {
      rank: 1,
      symbol: "AUDUSD",
      entry: 0.6912,
      exit: 0.6878,
      pnl: -187.30,
      r: -0.9,
      quality: "B",
      date: "Feb 6",
      lesson: "Traded before news event. No news calendar check.",
    },
    {
      rank: 2,
      symbol: "EURUSD",
      entry: 1.0945,
      exit: 1.0908,
      pnl: -162.50,
      r: -0.8,
      quality: "B",
      date: "Feb 15",
      lesson: "Revenge trade after W-1 loss. Emotional entry.",
    },
    {
      rank: 3,
      symbol: "GOLD",
      entry: 2101.20,
      exit: 2085.40,
      pnl: -145.10,
      r: -0.7,
      quality: "C",
      date: "Feb 22",
      lesson: "C-tier setup. Should have waited for A-grade entry.",
    },
    {
      rank: 4,
      symbol: "AUDUSD",
      entry: 0.6923,
      exit: 0.6897,
      pnl: -128.75,
      r: -0.6,
      quality: "B",
      date: "Feb 27",
      lesson: "Late in session. Tight stop but hit immediately.",
    },
  ],
};

const equityPoints = [
  { date: "Feb 1", balance: 10000, trades: 0 },
  { date: "Feb 7", balance: 10487.5, trades: 6 },
  { date: "Feb 14", balance: 11130.3, trades: 13 },
  { date: "Feb 21", balance: 11651.45, trades: 21 },
  { date: "Feb 28", balance: 12156.3, trades: 28 },
];

export default function BacktestResultsPage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Backtest Analysis</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">February 2026 Results</h1>
        <p className="text-sm text-slate-500 mt-1">Fair Value Gap system · EUR/USD 15m · Full month simulation</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Trades", value: "28", color: "text-slate-800" },
          { label: "Win Rate", value: "64.3%", color: "text-emerald-600" },
          { label: "P&L", value: "+$2,156.30", color: "text-emerald-600" },
          { label: "ROI", value: "21.6%", color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Account Performance */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Account Performance</h2>
          <div className="space-y-3">
            {[
              { label: "Starting balance", value: "$10,000" },
              { label: "Ending balance", value: "$12,156.30" },
              { label: "Gross profit", value: "$2,821.75" },
              { label: "Gross loss", value: "-$665.45" },
              { label: "Max drawdown", value: "-$425 (4.25%)" },
              { label: "Avg trade P&L", value: "$77.01" },
              { label: "Avg R per trade", value: "0.44R" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm font-mono font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Prop Firm Status</h2>
          <div className="space-y-3">
            {[
              { label: "Challenge target", value: "$5,000", sub: "Achieved: ✓ 43%" },
              { label: "Max monthly loss", value: "$1,000", sub: "Used: $665 (67%)" },
              { label: "Daily hard stop", value: "$400", sub: "Worst day: -$187" },
              { label: "Max DD allowed", value: "$10,000", sub: "Used: $425 (4%)" },
              { label: "Status", value: "PASSED", color: "text-emerald-600" },
            ].map((item, i) => (
              <div key={i} className="py-2 border-b border-slate-100 last:border-0">
                <div className="flex justify-between items-center mb-0.5">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className={`text-sm font-mono font-semibold ${item.color || "text-slate-800"}`}>{item.value}</p>
                </div>
                {item.sub && <p className="text-[10px] text-slate-400">{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Trade Quality Breakdown</h2>
          <div className="space-y-3">
            {[
              { tier: "A+ (Rare)", count: 4, pnl: 1242.70, avg: 310.68 },
              { tier: "A (Standard)", count: 14, pnl: 1125.45, avg: 80.39 },
              { tier: "B (Marginal)", count: 8, pnl: -211.85, avg: -26.48 },
              { tier: "C (Low conf)", count: 2, pnl: -0.00, avg: 0.00 },
            ].map((quality, i) => (
              <div key={i} className="py-2 border-b border-slate-100 last:border-0">
                <p className="text-xs font-semibold text-slate-700 mb-1">{quality.tier}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500">
                  <div>
                    <span className="text-slate-400">Count:</span> {quality.count}
                  </div>
                  <div>
                    <span className="text-slate-400">P&L:</span> ${quality.pnl.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-slate-400">Avg:</span> ${quality.avg.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Weekly Breakdown</h2>
        <div className="space-y-2">
          {februaryData.weeks.map((w) => (
            <div key={w.week} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-shrink-0 w-32">
                <p className="text-sm font-semibold text-slate-800">{w.week}</p>
                <p className="text-xs text-slate-400 mt-0.5">{w.trades} trades</p>
              </div>
              <div className="flex-1 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase">W/L</p>
                  <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                    {w.wins}/{w.losses}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(w.wins / w.trades) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-mono font-bold text-emerald-600">${w.pnl.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{w.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Wins */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Top 4 Winning Trades</h2>
        <div className="space-y-3">
          {februaryData.topWins.map((trade) => (
            <div key={trade.rank} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    #{trade.rank} — {trade.symbol}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{trade.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono text-emerald-600">${trade.pnl.toFixed(2)}</p>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">{trade.r}R</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] border-t border-emerald-200 pt-2 mt-2">
                <div>
                  <span className="text-slate-500">Entry:</span> {trade.entry}
                </div>
                <div>
                  <span className="text-slate-500">Exit:</span> {trade.exit}
                </div>
                <div className="text-right">
                  <span className="text-slate-500 bg-emerald-100 px-2 py-0.5 rounded">{trade.quality}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Losses */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Top 4 Losses (Learning)</h2>
        <div className="space-y-3">
          {februaryData.topLosses.map((trade) => (
            <div key={trade.rank} className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    #{trade.rank} — {trade.symbol}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{trade.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono text-red-600">${trade.pnl.toFixed(2)}</p>
                  <p className="text-xs text-red-700 font-semibold mt-0.5">{trade.r}R</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] border-t border-red-200 pt-2 mt-2 mb-2">
                <div>
                  <span className="text-slate-500">Entry:</span> {trade.entry}
                </div>
                <div>
                  <span className="text-slate-500">Exit:</span> {trade.exit}
                </div>
                <div className="text-right">
                  <span className="text-slate-500 bg-red-100 px-2 py-0.5 rounded">{trade.quality}</span>
                </div>
              </div>
              <div className="bg-red-100 rounded px-2 py-1.5 mt-2 border border-red-300">
                <p className="text-[10px] text-red-800">
                  <span className="font-semibold">Lesson:</span> {trade.lesson}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equity Curve */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Equity Curve — February 2026</h2>
        <div className="space-y-3">
          {equityPoints.map((point, i) => {
            const percent = ((point.balance - 10000) / 10000) * 100;
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-20">
                  <p className="text-sm font-semibold text-slate-800">{point.date}</p>
                  <p className="text-[10px] text-slate-400">{point.trades} trades</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                        style={{ width: `${Math.min((point.balance / 13000) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-right flex-shrink-0 w-24">
                      <p className="text-sm font-mono font-bold text-emerald-600">${point.balance.toFixed(2)}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">+{percent.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs text-emerald-800">
            <span className="font-semibold">Key insight:</span> Consistent week-over-week growth despite mid-month volatility. Drawdown management working well. Ready for live Prop Firm challenge.
          </p>
        </div>
      </div>
    </WikiLayout>
  );
}
