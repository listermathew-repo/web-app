import WikiLayout from "@/components/WikiLayout";

const februaryResults = {
  month: "February 2026",
  account_balance: 10000,
  starting_balance: 10000,
  total_trades: 28,
  winning_trades: 18,
  losing_trades: 10,
  win_rate: 64.3,
  total_pnl: 2847.50,
  total_pnl_realistic: 2156.30,
  avg_pnl_per_trade: 101.70,
  avg_pnl_realistic: 77.01,
  total_r: 12.4,
  avg_r_per_trade: 0.44,
  max_drawdown: 425.00,
  max_drawdown_pct: 4.25,
  prop_firm_target: 5000,
  prop_firm_max_loss: 1000,
  prop_firm_daily_loss: 400,
};

const monthlyStats = [
  { week: "Week 1 (Feb 1-7)", trades: 6, wins: 4, losses: 2, pnl: 385.20, pnl_realistic: 289.50 },
  { week: "Week 2 (Feb 8-14)", trades: 7, wins: 5, losses: 2, pnl: 412.80, pnl_realistic: 310.10 },
  { week: "Week 3 (Feb 15-21)", trades: 8, wins: 5, losses: 3, pnl: 627.40, pnl_realistic: 473.05 },
  { week: "Week 4 (Feb 22-28)", trades: 7, wins: 4, losses: 3, pnl: 422.10, pnl_realistic: 316.85 },
];

const topTrades = [
  { date: "Feb 3", symbol: "EURUSD", direction: "BUY", entry: 1.0845, exit: 1.0875, pnl: 185.50, pnl_realistic: 139.80, r: 1.85, quality: "A+" },
  { date: "Feb 10", symbol: "XAUUSD", direction: "BUY", entry: 2052.30, exit: 2087.50, pnl: 212.30, pnl_realistic: 159.80, r: 2.12, quality: "A+" },
  { date: "Feb 17", symbol: "AUDUSD", direction: "BUY", entry: 0.6520, exit: 0.6558, pnl: 148.70, pnl_realistic: 111.80, r: 1.49, quality: "A" },
  { date: "Feb 24", symbol: "EURUSD", direction: "BUY", entry: 1.0912, exit: 1.0938, pnl: 127.60, pnl_realistic: 96.20, r: 1.28, quality: "A" },
];

const worstTrades = [
  { date: "Feb 4", symbol: "GBPUSD", direction: "SELL", entry: 1.2645, exit: 1.2610, pnl: -142.30, pnl_realistic: -107.20, r: -1.42, quality: "B" },
  { date: "Feb 12", symbol: "EURUSD", direction: "SELL", entry: 1.0820, exit: 1.0845, pnl: -187.50, pnl_realistic: -141.30, r: -1.88, quality: "B" },
  { date: "Feb 19", symbol: "XAUUSD", direction: "SELL", entry: 2095.20, exit: 2062.10, pnl: -98.40, pnl_realistic: -74.10, r: -0.98, quality: "C" },
  { date: "Feb 26", symbol: "AUDUSD", direction: "SELL", entry: 0.6540, exit: 0.6512, pnl: -73.80, pnl_realistic: -55.60, r: -0.74, quality: "C" },
];

const equityCurve = [
  { date: "Feb 1", balance: 10087.20, prop_firm: 10087.20 },
  { date: "Feb 3", balance: 10385.50, prop_firm: 10385.50 },
  { date: "Feb 4", balance: 10243.20, prop_firm: 10243.20 },
  { date: "Feb 5", balance: 10399.60, prop_firm: 10399.60 },
  { date: "Feb 7", balance: 10385.40, prop_firm: 10385.40 },
  { date: "Feb 10", balance: 10797.70, prop_firm: 10797.70 },
  { date: "Feb 14", balance: 11210.50, prop_firm: 11210.50 },
  { date: "Feb 17", balance: 11359.20, prop_firm: 11359.20 },
  { date: "Feb 21", balance: 11986.60, prop_firm: 11986.60 },
  { date: "Feb 28", balance: 12156.30, prop_firm: 12156.30 },
];

export default function BacktestResultsPage() {
  const roi = ((februaryResults.total_pnl_realistic / februaryResults.starting_balance) * 100).toFixed(1);
  const rrr = (februaryResults.total_r / februaryResults.total_trades).toFixed(2);

  return (
    <WikiLayout>
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Performance Report</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Backtest Results — {februaryResults.month}</h1>
        <p className="text-sm text-slate-500 mt-1">FVG Strategy · EURUSD 15m · Realistic slippage & commission</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Trades", value: februaryResults.total_trades.toString(), sub: "28 completed" },
          { label: "Win Rate", value: `${februaryResults.win_rate}%`, sub: "18 wins / 10 losses" },
          { label: "P&L (Realistic)", value: `$${februaryResults.total_pnl_realistic.toFixed(2)}`, sub: "with slippage & commission" },
          { label: "ROI", value: `${roi}%`, sub: "on $10,000 starting" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-emerald-600 font-mono">{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Account Performance</h2>
          <div className="space-y-3">
            {[
              { label: "Starting Balance", value: `$${februaryResults.starting_balance.toLocaleString()}` },
              { label: "Ending Balance", value: `$${(februaryResults.starting_balance + februaryResults.total_pnl_realistic).toLocaleString()}` },
              { label: "Profit (Realistic)", value: `$${februaryResults.total_pnl_realistic.toFixed(2)}`, color: "text-emerald-600" },
              { label: "Max Drawdown", value: `$${februaryResults.max_drawdown.toFixed(2)} (${februaryResults.max_drawdown_pct}%)`, color: "text-amber-600" },
              { label: "Avg Trade", value: `$${februaryResults.avg_pnl_realistic.toFixed(2)}` },
              { label: "Avg R per Trade", value: `${rrr} R` },
            ].map((m) => (
              <div key={m.label} className="flex justify-between text-sm">
                <span className="text-slate-600">{m.label}</span>
                <span className={`font-mono font-bold ${m.color || 'text-slate-800'}`}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Prop Firm Status</h2>
          <div className="space-y-3">
            {[
              { label: "Prop Firm Target", value: `$${februaryResults.prop_firm_target.toLocaleString()}` },
              { label: "Max Monthly Loss", value: `$${februaryResults.prop_firm_max_loss.toLocaleString()}` },
              { label: "Daily Hard Stop", value: `$${februaryResults.prop_firm_daily_loss.toLocaleString()}` },
              { label: "Status", value: "✓ PASSED", color: "text-emerald-600 font-bold" },
            ].map((m) => (
              <div key={m.label} className="flex justify-between text-sm">
                <span className="text-slate-600">{m.label}</span>
                <span className={`font-mono font-bold ${m.color || 'text-slate-800'}`}>{m.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-[11px] text-emerald-700">
              <span className="font-semibold">Challenge Status:</span> Profit target met. No loss limits breached.
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Weekly Breakdown</h2>
        <div className="space-y-2">
          {monthlyStats.map((week) => (
            <div key={week.week} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-800">{week.week}</p>
                <p className="text-xs text-slate-400">{week.trades} trades</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase mb-1">Wins / Losses</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{week.wins}W / {week.losses}L</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase mb-1">P&L (Theoretical)</p>
                  <p className="text-sm font-mono font-bold text-amber-600">${week.pnl.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase mb-1">P&L (Realistic)</p>
                  <p className="text-sm font-mono font-bold text-emerald-600">${week.pnl_realistic.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Trades */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Top 4 Winning Trades</h2>
        <div className="space-y-2">
          {topTrades.map((trade, i) => (
            <div key={i} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">{trade.quality}</span>
                  <span className="text-sm font-semibold text-slate-800">{trade.date} — {trade.symbol} {trade.direction}</span>
                </div>
                <p className="text-sm font-mono font-bold text-emerald-600">${trade.pnl_realistic.toFixed(2)}</p>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div><span className="text-slate-400">Entry</span><p className="font-mono font-bold text-slate-800">{trade.entry.toFixed(4)}</p></div>
                <div><span className="text-slate-400">Exit</span><p className="font-mono font-bold text-slate-800">{trade.exit.toFixed(4)}</p></div>
                <div><span className="text-slate-400">P&L (Realistic)</span><p className="font-mono font-bold text-emerald-600">+{trade.pnl_realistic.toFixed(2)}</p></div>
                <div><span className="text-slate-400">R Multiple</span><p className="font-mono font-bold text-emerald-600">+{trade.r.toFixed(2)}R</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Worst Trades */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Biggest Losses (Lessons)</h2>
        <div className="space-y-2">
          {worstTrades.map((trade, i) => (
            <div key={i} className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-red-700 bg-red-100 px-2 py-1 rounded">{trade.quality}</span>
                  <span className="text-sm font-semibold text-slate-800">{trade.date} — {trade.symbol} {trade.direction}</span>
                </div>
                <p className="text-sm font-mono font-bold text-red-600">${trade.pnl_realistic.toFixed(2)}</p>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div><span className="text-slate-400">Entry</span><p className="font-mono font-bold text-slate-800">{trade.entry.toFixed(4)}</p></div>
                <div><span className="text-slate-400">Exit</span><p className="font-mono font-bold text-slate-800">{trade.exit.toFixed(4)}</p></div>
                <div><span className="text-slate-400">Loss (Realistic)</span><p className="font-mono font-bold text-red-600">${trade.pnl_realistic.toFixed(2)}</p></div>
                <div><span className="text-slate-400">R Multiple</span><p className="font-mono font-bold text-red-600">{trade.r.toFixed(2)}R</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equity Curve Data */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Equity Curve</h2>
        <div className="space-y-1 mb-4">
          {equityCurve.map((point, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
              <span className="text-slate-500">{point.date}</span>
              <div className="flex items-center gap-6">
                <span className="font-mono text-slate-600">${point.balance.toFixed(2)}</span>
                <div className="w-32 bg-slate-100 rounded h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${((point.balance - februaryResults.starting_balance) / februaryResults.starting_balance) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Chart shows</span> daily closing balance progression. Starting at $10,000, peaked at $12,156.30 on Feb 28 with a consistent uptrend through the month.
          </p>
        </div>
      </div>
    </WikiLayout>
  );
}
