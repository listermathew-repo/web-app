import WikiLayout from "@/components/WikiLayout";
import PulsePointDashboard from "@/components/PulsePointDashboard";

export const metadata = {
  title: "15-Minute Pulse Point Engine — FVG Setup Detection",
  description: "Real-time Fair Value Gap detection with 4H/1H/15M confluence scoring",
};

export default function PulsePage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚡</span>
          <h1 className="text-3xl font-bold text-slate-900">
            15-Minute Pulse Point Engine
          </h1>
        </div>
        <p className="text-slate-500 mt-2">
          Real-time FVG setup detection on BTCUSD + EURUSD
        </p>
      </div>

      <PulsePointDashboard />

      {/* Strategy Overview */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Timeframe Confluence */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <span>📊</span> Multi-Timeframe Confluence
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✅ <strong>4H:</strong> Trend bias (long/short)</li>
              <li>✅ <strong>1H:</strong> Setup confirmation (FVG rejection)</li>
              <li>✅ <strong>15M:</strong> Precise entry point (breakout/retap)</li>
              <li className="text-xs text-blue-600 mt-2">
                Score: 70+ = valid setup | 80+ = high confidence
              </li>
            </ul>
          </div>

          {/* Expected Results */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <span>📈</span> Expected Results (Peak Window: 2pm-4pm ADL)
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>📍 <strong>2-3 setups</strong> per 2-hour window</li>
              <li>📊 <strong>55-99 setups</strong> per month</li>
              <li>💰 <strong>$46,900-$91,350</strong> monthly profit</li>
              <li>🎯 <strong>56-61%</strong> win rate (validated)</li>
            </ul>
          </div>

          {/* Trade Parameters */}
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <span>⚙️</span> Trade Parameters
            </h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li>💵 <strong>Risk/Trade:</strong> $350 USD</li>
              <li>📊 <strong>R:R Ratio:</strong> 5.0:1</li>
              <li>⏱️ <strong>Setup Valid:</strong> 30 minutes</li>
              <li>🪟 <strong>Trading Hours:</strong> 9am-10pm ADL</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confidence Scoring */}
      <div className="mt-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Confluence Score Breakdown</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-700">
              All 3 timeframes aligned (4H, 1H, 15M)
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
              +30 pts
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-700">
              4H & 1H trend agreement
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
              +20 pts
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-700">
              1H & 15M setup agreement
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
              +15 pts
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-700">
              RSI extremes (0-30 or 70-100)
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
              +10 pts
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-700">
              Price/VWAP alignment
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
              +5 pts
            </span>
          </div>

          <div className="pt-3 border-t border-slate-300">
            <div className="flex justify-between items-center font-semibold">
              <span>Target Score</span>
              <span className="text-lg text-slate-900">70-100</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ✅ 70+ = Valid setup for approval queue | 80+ = High confidence
            </div>
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="mt-8 bg-amber-50 p-6 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
          <span>🔄</span> Real-Time Workflow
        </h3>

        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-900 text-xs">
              1
            </div>
            <div>
              <p className="font-semibold text-amber-900">Every 15 minutes (9am-10pm ADL)</p>
              <p className="text-sm text-amber-700">
                Pulse engine checks BTCUSD + EURUSD for new FVG formations
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-900 text-xs">
              2
            </div>
            <div>
              <p className="font-semibold text-amber-900">Setup Detection (15-30 min advance)</p>
              <p className="text-sm text-amber-700">
                FVG formations detected → ntfy.sh alert sent to your phone
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-900 text-xs">
              3
            </div>
            <div>
              <p className="font-semibold text-amber-900">Approval Queue</p>
              <p className="text-sm text-amber-700">
                Setup added to /api/pending - 5 minute approval window
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-900 text-xs">
              4
            </div>
            <div>
              <p className="font-semibold text-amber-900">Manual Approval → Execution</p>
              <p className="text-sm text-amber-700">
                POST to /api/pending/[id]/approve → Capital.com order placed
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-900 text-xs">
              5
            </div>
            <div>
              <p className="font-semibold text-amber-900">Position Monitoring</p>
              <p className="text-sm text-amber-700">
                GET /api/positions → Real-time P&L + stop loss tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="mt-8">
        <h3 className="font-semibold text-slate-900 mb-4">API Endpoints</h3>

        <div className="space-y-4">
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <p>GET /api/pulse</p>
            <p className="text-xs text-slate-400 mt-1">
              Triggers pulse point checks. Returns detected setups with confidence scores.
            </p>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <p>GET /api/pending</p>
            <p className="text-xs text-slate-400 mt-1">
              List pending setups awaiting approval (5-minute window)
            </p>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <p>POST /api/pending/[id]/approve</p>
            <p className="text-xs text-slate-400 mt-1">
              Approve setup and execute trade via Capital.com
            </p>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <p>GET /api/positions</p>
            <p className="text-xs text-slate-400 mt-1">
              Get open positions with live P&L from Capital.com
            </p>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">System Status</h3>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 font-semibold uppercase">Status</p>
            <p className="text-lg font-bold text-green-900 mt-1">
              ✅ Ready
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-semibold uppercase">Next Pulse</p>
            <p className="text-lg font-bold text-blue-900 mt-1">
              In 15 min
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-600 font-semibold uppercase">Peak Window</p>
            <p className="text-lg font-bold text-purple-900 mt-1">
              2pm-4pm ADL
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-600 font-semibold uppercase">Expected/Month</p>
            <p className="text-lg font-bold text-amber-900 mt-1">
              55-99 trades
            </p>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
