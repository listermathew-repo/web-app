import WikiLayout from "@/components/WikiLayout";
import BacktestDashboard from "@/components/BacktestDashboard";

export const metadata = {
  title: "FVG Backtest Dashboard — Trading System",
  description: "Multi-month backtest analysis with $200/$350 risk scenarios",
};

export default function BacktestPage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📊</span>
          <h1 className="text-3xl font-bold text-slate-900">FVG Strategy Backtest</h1>
        </div>
        <p className="text-slate-500 mt-2">February - May 2026 | 4-Month Analysis</p>
      </div>

      <BacktestDashboard />

      {/* Footer Info */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Instruments</h3>
            <ul className="space-y-1 text-slate-600">
              <li>✅ BTCUSD — Primary</li>
              <li>✅ XAUUSD — Secondary</li>
              <li>Optimized for 9am-4pm ADL window</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Strategy Parameters</h3>
            <ul className="space-y-1 text-slate-600">
              <li>R:R Ratio: 4.5:1</li>
              <li>Expected Win Rate: 56.25%</li>
              <li>Trades/Month: 10</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Data Source</h3>
            <ul className="space-y-1 text-slate-600">
              <li>TradingView historical data</li>
              <li>Live chart analysis</li>
              <li>Fair Value Gap (FVG) signals</li>
            </ul>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
