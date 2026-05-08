import WikiLayout from "@/components/WikiLayout";

const whatItIs = [
  { title: "Automated Trading System", description: "FastAPI webhook server that connects TradingView alerts directly to Capital.com broker" },
  { title: "Real-Time Execution", description: "TradingView alerts trigger trades automatically — no manual order placement needed" },
  { title: "Instant Notifications", description: "ntfy.sh alerts notify you immediately when trades execute, with full order details" },
  { title: "Demo & Live Modes", description: "Simulate trades safely before going live with real Capital.com account" },
];

const whatItDoes = [
  {
    step: "1",
    action: "TradingView Alert Triggers",
    description: "Your chart signals a BUY or SELL (price crosses level, indicator fires, etc.)",
  },
  {
    step: "2",
    action: "Webhook Fires",
    description: "Alert sends trade details (symbol, entry, stop loss, take profit, risk %) to your server",
  },
  {
    step: "3",
    action: "Server Receives & Validates",
    description: "FastAPI webhook validates passphrase and JSON structure",
  },
  {
    step: "4",
    action: "Trade Executes",
    description: "Capital.com client places market order with size calculated from risk management rules",
  },
  {
    step: "5",
    action: "Notification Sent",
    description: "ntfy.sh sends you instant alert with deal reference, size, and order details",
  },
];

const nextSteps = [
  {
    priority: "HIGH",
    task: "Test Multiple TradingView Alerts",
    details: "Create alerts on different symbols (EURUSD, GBPUSD, GOLD) and verify ntfy notifications arrive",
  },
  {
    priority: "HIGH",
    task: "Fix Capital.com API Connection",
    details: "Resolve DNS/network issues connecting to demo-api-capital.backend.gbk.ab.capital.com. Check credentials.",
  },
  {
    priority: "HIGH",
    task: "Verify Position Sizing",
    description: "Test that risk% calculations work correctly and orders size appropriately",
  },
  {
    priority: "MED",
    task: "Go LIVE Trading",
    details: "Change DRY_RUN=false in .env to execute real trades on Capital.com demo account",
  },
  {
    priority: "MED",
    task: "Add Trade Logging",
    details: "Store all executed trades + results in database or CSV for performance tracking",
  },
  {
    priority: "MED",
    task: "Enable Real Money Trading",
    details: "Change CAPITAL_ENV=live and add real Capital.com account credentials when ready",
  },
  {
    priority: "LOW",
    task: "Dashboard Analytics",
    details: "Build a performance dashboard showing P&L, win rate, average risk/reward by symbol",
  },
];

const systemStatus = [
  { component: "FastAPI Server", status: "✅ Running", location: "localhost:8000 (Cloudflare tunnel active)" },
  { component: "Webhook Endpoint", status: "✅ Active", location: "https://waves-treated-ecommerce-artist.trycloudflare.com/webhook" },
  { component: "ntfy Notifications", status: "✅ Working", location: "https://ntfy.sh/mgm-7k4x-live" },
  { component: "Capital.com API", status: "⚠️ Testing", location: "Demo environment credentials configured" },
  { component: "Simulate Mode", status: "✅ Working", location: "DRY_RUN=true (no trades executed)" },
];

export default function TradingSystemPage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Automation</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Trading System</h1>
        <p className="text-sm text-slate-500 mt-1">TradingView → FastAPI → Capital.com automation with real-time alerts</p>
      </div>

      {/* What It Is */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4">What Is It?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {whatItIs.map((item, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm font-semibold text-slate-800 mb-1">{item.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What It Does - Flow */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-5">What It Does</h2>
        <div className="space-y-4">
          {whatItDoes.map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 border border-amber-300">
                  <span className="text-sm font-bold text-amber-700">{item.step}</span>
                </div>
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-semibold text-slate-800">{item.action}</p>
                <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">System Status</h2>
        <div className="space-y-2">
          {systemStatus.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 px-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{item.component}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.location}</p>
              </div>
              <span className="text-xs font-semibold flex-shrink-0">{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-5">What You Need to Do Next</h2>
        <div className="space-y-3">
          {nextSteps.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3 px-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className={`text-[10px] font-bold rounded px-2 py-1 flex-shrink-0 uppercase border mt-0.5
                ${item.priority === "HIGH" ? "text-red-700 bg-red-50 border-red-200" :
                  item.priority === "MED" ? "text-amber-700 bg-amber-50 border-amber-200" :
                  "text-slate-500 bg-slate-100 border-slate-200"}`}>
                {item.priority}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.task}</p>
                <p className="text-xs text-slate-600 mt-1">{item.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Create a TradingView Alert */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6 shadow-sm">
        <h2 className="text-sm font-semibold text-green-900 uppercase tracking-wider mb-4">How to Create a TradingView Alert</h2>
        <div className="space-y-3 text-sm text-slate-700">
          <p><span className="font-semibold">1. Open TradingView</span> → Go to your chart</p>
          <p><span className="font-semibold">2. Right-click chart</span> → Select "Add alert"</p>
          <p><span className="font-semibold">3. Set conditions</span> → Choose your signal (price cross, indicator, etc.)</p>
          <p><span className="font-semibold">4. In Message field, paste:</span></p>
          <div className="bg-white rounded p-3 font-mono text-xs mt-2 border border-slate-200 overflow-x-auto">
            {`{
  "passphrase": "7gs9C$*lg9wxS!",
  "ticker": "EURUSD",
  "action": "BUY",
  "entry_price": 1.095,
  "risk_percent": 0.5,
  "stop_loss": 1.090,
  "take_profit": 1.105
}`}
          </div>
          <p className="mt-3"><span className="font-semibold">5. Enable "Webhook URL"</span> → Paste: <span className="font-mono bg-slate-100 px-1 rounded text-[11px]">https://waves-treated-ecommerce-artist.trycloudflare.com/webhook</span></p>
          <p><span className="font-semibold">6. Click "Create Alert"</span> ✅</p>
        </div>
      </div>

      {/* Key Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-6">
        <p className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-800">Keep in mind:</span> The Cloudflare tunnel must stay running in PowerShell for alerts to reach your server. If tunnel disconnects, recreate it with <span className="font-mono bg-white px-1 rounded text-[11px]">cloudflared tunnel --url http://localhost:8000</span>
        </p>
      </div>
    </WikiLayout>
  );
}
