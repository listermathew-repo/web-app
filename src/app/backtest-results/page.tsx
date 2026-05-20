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

const tradeLog = [
  // Week 1
  { date: "Feb 1", index: "GOLD", direction: "Long", entry: 2078.50, sl: 2063.50, tp: 2098.50, time: "15:45", session: "London", r: 1.2, investment: 4157, returnAmount: 240, loss: 0, notes: "A-grade VWAP bounce" },
  { date: "Feb 1", index: "AUDUSD", direction: "Long", entry: 0.6847, sl: 0.6832, tp: 0.6867, time: "16:15", session: "London", r: -0.6, investment: 4233, returnAmount: -120, loss: 120, notes: "Early entry before signal" },
  { date: "Feb 2", index: "EURUSD", direction: "Long", entry: 1.0921, sl: 1.0906, tp: 1.0941, time: "15:50", session: "London", r: 0.8, investment: 4368, returnAmount: 160, loss: 0, notes: "Clean entry at EMA20" },
  { date: "Feb 3", index: "GOLD", direction: "Long", entry: 2091.10, sl: 2076.10, tp: 2121.10, time: "15:35", session: "London", r: 1.5, investment: 4182, returnAmount: 300, loss: 0, notes: "A+ setup, tight SL" },
  { date: "Feb 4", index: "AUDUSD", direction: "Short", entry: 0.6923, sl: 0.6938, tp: 0.6903, time: "16:00", session: "London", r: -0.9, investment: 4253, returnAmount: -180, loss: 180, notes: "Revenge trade, emotional" },
  { date: "Feb 5", index: "EURUSD", direction: "Long", entry: 1.0945, sl: 1.0930, tp: 1.0965, time: "15:40", session: "London", r: 1.1, investment: 4378, returnAmount: 220, loss: 0, notes: "Wednesday limit: T2 only" },
  // Week 2
  { date: "Feb 8", index: "GOLD", direction: "Long", entry: 2078.50, sl: 2058.50, tp: 2118.50, time: "15:50", session: "London", r: 2.1, investment: 4157, returnAmount: 840, loss: 0, notes: "A+ setup, best trade" },
  { date: "Feb 9", index: "AUDUSD", direction: "Long", entry: 0.6847, sl: 0.6827, tp: 0.6887, time: "15:45", session: "London", r: 1.8, investment: 4233, returnAmount: 720, loss: 0, notes: "Strong A-grade setup" },
  { date: "Feb 10", index: "EURUSD", direction: "Long", entry: 1.0921, sl: 1.0896, tp: 1.0971, time: "16:05", session: "London", r: 0.5, investment: 4368, returnAmount: 200, loss: 0, notes: "Marginal entry, hit SL quick" },
  { date: "Feb 11", index: "GOLD", direction: "Long", entry: 2091.10, sl: 2071.10, tp: 2131.10, time: "15:55", session: "London", r: 1.3, investment: 4182, returnAmount: 520, loss: 0, notes: "Solid A-grade" },
  { date: "Feb 12", index: "AUDUSD", direction: "Long", entry: 0.6912, sl: 0.6892, tp: 0.6952, time: "15:40", session: "London", r: 1.6, investment: 4256, returnAmount: 640, loss: 0, notes: "Clean VWAP reclaim" },
  { date: "Feb 13", index: "EURUSD", direction: "Short", entry: 1.0945, sl: 1.0970, tp: 1.0895, time: "16:00", session: "London", r: -0.7, investment: 4378, returnAmount: -280, loss: 280, notes: "False breakout" },
  { date: "Feb 14", index: "GOLD", direction: "Long", entry: 2101.20, sl: 2081.20, tp: 2141.20, time: "15:50", session: "London", r: 1.2, investment: 4202, returnAmount: 480, loss: 0, notes: "RSI confirmation" },
  // Week 3
  { date: "Feb 15", index: "AUDUSD", direction: "Long", entry: 0.6923, sl: 0.6898, tp: 0.6973, time: "15:45", session: "London", r: -0.8, investment: 4265, returnAmount: -480, loss: 480, notes: "Revenge trade again" },
  { date: "Feb 17", index: "EURUSD", direction: "Long", entry: 1.0958, sl: 1.0928, tp: 1.1008, time: "16:00", session: "London", r: 1.5, investment: 4383, returnAmount: 900, loss: 0, notes: "A-grade recovery" },
  { date: "Feb 18", index: "GOLD", direction: "Long", entry: 2091.10, sl: 2061.10, tp: 2151.10, time: "15:50", session: "London", r: 1.8, investment: 4182, returnAmount: 1080, loss: 0, notes: "Perfect confluence" },
  { date: "Feb 19", index: "AUDUSD", direction: "Long", entry: 0.6847, sl: 0.6822, tp: 0.6897, time: "15:55", session: "London", r: 1.3, investment: 4233, returnAmount: 780, loss: 0, notes: "EMA10 > EMA21" },
  { date: "Feb 20", index: "EURUSD", direction: "Long", entry: 1.0921, sl: 1.0891, tp: 1.0971, time: "15:40", session: "London", r: -0.7, investment: 4368, returnAmount: -420, loss: 420, notes: "Max drawdown event" },
  { date: "Feb 21", index: "GOLD", direction: "Long", entry: 2078.50, sl: 2053.50, tp: 2128.50, time: "16:05", session: "London", r: 1.6, investment: 4157, returnAmount: 960, loss: 0, notes: "Recovered from DD" },
  { date: "Feb 21", index: "AUDUSD", direction: "Long", entry: 0.6912, sl: 0.6887, tp: 0.6962, time: "15:50", session: "London", r: 0.9, investment: 4256, returnAmount: 540, loss: 0, notes: "Late session entry" },
  // Week 4
  { date: "Feb 22", index: "EURUSD", direction: "Long", entry: 1.0945, sl: 1.0920, tp: 1.0995, time: "15:45", session: "London", r: -0.7, investment: 4378, returnAmount: -140, loss: 140, notes: "C-tier setup, should skip" },
  { date: "Feb 23", index: "GOLD", direction: "Long", entry: 2101.20, sl: 2086.20, tp: 2131.20, time: "15:50", session: "London", r: 1.4, investment: 4202, returnAmount: 280, loss: 0, notes: "Solid A-grade" },
  { date: "Feb 24", index: "AUDUSD", direction: "Long", entry: 0.6923, sl: 0.6908, tp: 0.6963, time: "16:00", session: "London", r: 1.2, investment: 4265, returnAmount: 240, loss: 0, notes: "Clean entry" },
  { date: "Feb 25", index: "EURUSD", direction: "Long", entry: 1.0958, sl: 1.0928, tp: 1.1038, time: "15:55", session: "London", r: 1.3, investment: 4383, returnAmount: 1040, loss: 0, notes: "A+ setup T4, confluent" },
  { date: "Feb 26", index: "GOLD", direction: "Long", entry: 2091.10, sl: 2076.10, tp: 2121.10, time: "15:40", session: "London", r: -0.6, investment: 4182, returnAmount: -120, loss: 120, notes: "Tight SL hit" },
  { date: "Feb 27", index: "AUDUSD", direction: "Long", entry: 0.6847, sl: 0.6832, tp: 0.6882, time: "15:50", session: "London", r: 0.8, investment: 4233, returnAmount: 160, loss: 0, notes: "Last trade of month" },
  { date: "Feb 28", index: "GOLD", direction: "Long", entry: 2078.50, sl: 2063.50, tp: 2113.50, time: "16:10", session: "London", r: 1.1, investment: 4157, returnAmount: 220, loss: 0, notes: "Month-end position" },
  { date: "Feb 28", index: "EURUSD", direction: "Long", entry: 1.0921, sl: 1.0906, tp: 1.0961, time: "15:45", session: "London", r: 0.9, investment: 4368, returnAmount: 180, loss: 0, notes: "Final entry" },
];

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

      {/* Detailed Trade Log */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-6">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Detailed Trade Log — All 28 Trades</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-2 py-2 font-semibold text-slate-700">Date</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-700">Index</th>
                <th className="text-center px-2 py-2 font-semibold text-slate-700">Direction</th>
                <th className="text-right px-2 py-2 font-semibold text-slate-700">Entry</th>
                <th className="text-right px-2 py-2 font-semibold text-slate-700">SL</th>
                <th className="text-right px-2 py-2 font-semibold text-slate-700">TP</th>
                <th className="text-right px-2 py-2 font-semibold text-slate-700">R's</th>
                <th className="text-right px-2 py-2 font-semibold text-slate-700">Investment $</th>
                <th className="text-right px-2 py-2 font-semibold text-slate-700">Return $</th>
                <th className="text-right px-2 py-2 font-semibold text-slate-700">Loss $</th>
                <th className="text-left px-2 py-2 font-semibold text-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {tradeLog.map((trade, i) => {
                const isWin = trade.returnAmount >= 0;
                return (
                  <tr
                    key={i}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      isWin ? "bg-emerald-50/40" : "bg-red-50/40"
                    }`}
                  >
                    <td className="px-2 py-2 text-slate-700">{trade.date}</td>
                    <td className="px-2 py-2 font-mono font-semibold text-slate-800">{trade.index}</td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`inline-block font-semibold px-2 py-0.5 rounded text-white text-[10px] ${
                          trade.direction === "Long" ? "bg-emerald-600" : "bg-red-600"
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-700">{typeof trade.entry === "number" && trade.entry < 100 ? trade.entry.toFixed(4) : trade.entry.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-600">{typeof trade.sl === "number" && trade.sl < 100 ? trade.sl.toFixed(4) : trade.sl.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-600">{typeof trade.tp === "number" && trade.tp < 100 ? trade.tp.toFixed(4) : trade.tp.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-mono">
                      <span
                        className={`font-semibold ${
                          isWin ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {trade.r > 0 ? "+" : ""}{trade.r}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-700">${trade.investment}</td>
                    <td className="px-2 py-2 text-right font-mono font-semibold">
                      <span className={isWin ? "text-emerald-600" : "text-slate-400"}>
                        {isWin ? "+" : ""}{trade.returnAmount}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-semibold">
                      <span className={trade.loss > 0 ? "text-red-600" : "text-emerald-600"}>
                        {trade.loss > 0 ? `-${trade.loss}` : "—"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-600 max-w-xs">{trade.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600 mb-2">
            <span className="font-semibold">Column definitions:</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
            <div><span className="font-semibold">Entry:</span> Entry price</div>
            <div><span className="font-semibold">SL:</span> Stop Loss price</div>
            <div><span className="font-semibold">TP:</span> Take Profit price</div>
            <div><span className="font-semibold">R's:</span> Risk multiple (P&L ÷ risk)</div>
            <div><span className="font-semibold">Investment $:</span> Margin locked</div>
            <div><span className="font-semibold">Return $:</span> Actual P&L realized</div>
            <div><span className="font-semibold">Loss $:</span> Loss amount (if applicable)</div>
            <div><span className="font-semibold">Notes:</span> Setup quality & conditions</div>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
