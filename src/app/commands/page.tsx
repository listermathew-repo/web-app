import WikiLayout from "@/components/WikiLayout";

const commandGroups = [
  {
    category: "Daily Session",
    icon: "⬡",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    description: "Type these at the start of or during a trading session",
    commands: [
      {
        trigger: "15:00 check",
        what: "Full signal check",
        detail: "Runs the 5-condition gate on GOLD, AUDUSD, EURUSD. Use at 15:00 ACST sharp before London open.",
        example: "15:00 check",
      },
      {
        trigger: "morning brief",
        what: "Overnight context",
        detail: "Pulls current prices, overnight move, and asks you to confirm Scenario 1 bias from your morning video.",
        example: "morning brief",
      },
      {
        trigger: "signal check [PAIR]",
        what: "Single-pair conditions",
        detail: "Checks all 5 entry conditions for one pair only.",
        example: "signal check AUDUSD",
      },
      {
        trigger: "chart read [PAIR]",
        what: "Live indicator snapshot",
        detail: "Reads VWAP, RSI, EMAs from TradingView and gives a plain-English summary.",
        example: "chart read GOLD",
      },
      {
        trigger: "what's outstanding?",
        what: "Open task list",
        detail: "Lists everything pending from the current session and the running agenda.",
        example: "what's outstanding?",
      },
    ],
  },
  {
    category: "Trade Management",
    icon: "◎",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    description: "Position sizing, risk checks, and live trade support",
    commands: [
      {
        trigger: "calculate position [PAIR] [SL] [tier]",
        what: "Lot size calculator",
        detail: "Returns lot size, margin required, and R:R based on your SL distance and chosen tier.",
        example: "calculate position GOLD 20pts T2",
      },
      {
        trigger: "am I within hard stops?",
        what: "Daily DD check",
        detail: "Checks your stated daily P&L against the $1,600 personal limit and $4,000 FTMO hard stop.",
        example: "am I within hard stops? down $600 today",
      },
      {
        trigger: "update shadow tracker [P&L]",
        what: "FTMO shadow log",
        detail: "Takes your real P&L, multiplies by 1.25, and tells you the updated shadow balance and status.",
        example: "update shadow tracker real P&L +$420",
      },
      {
        trigger: "post-session log",
        what: "Session debrief",
        detail: "Walks you through the 3-field post-session log: process score, psychology score, one lesson.",
        example: "post-session log",
      },
      {
        trigger: "BE rule — where do I move my stop?",
        what: "Breakeven calculation",
        detail: "Given your entry and tier, calculates the exact price level to move SL to breakeven.",
        example: "BE rule — entry 4800 T2 SL 4785",
      },
    ],
  },
  {
    category: "Strategy & Analysis",
    icon: "◈",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    description: "Deep analysis, decisions, and research",
    commands: [
      {
        trigger: "council this: [question]",
        what: "5-advisor LLM council",
        detail: "Convenes 5 advisors (Contrarian, First Principles, Expansionist, Outsider, Executor) + peer review + chairman verdict. Use Opus model for this.",
        example: "council this: should I apply for FTMO now or wait 30 more days?",
      },
      {
        trigger: "steelman [decision]",
        what: "Best-case / worst-case",
        detail: "Builds the strongest possible case for AND against a decision. Good for rule changes.",
        example: "steelman moving to T3 as my default tier",
      },
      {
        trigger: "time machine [date]",
        what: "Historical session reconstruction",
        detail: "Reconstructs what the chart looked like on a given date — were all conditions met? Would the system have taken that trade?",
        example: "time machine April 17 2026 GOLD",
      },
      {
        trigger: "backtest [hypothesis]",
        what: "Research request",
        detail: "Runs a structured analysis of a trading hypothesis using available data.",
        example: "backtest GOLD Monday vs Friday win rate London open",
      },
      {
        trigger: "full desk review",
        what: "Board + Council session",
        detail: "Calls the full trading board and council for a major decision. Use for strategy pivots, system changes, prop firm decisions.",
        example: "full desk review — should I change my SL methodology?",
      },
    ],
  },
  {
    category: "Alerts & TradingView",
    icon: "◉",
    color: "text-purple-700 bg-purple-50 border-purple-200",
    description: "Alert management and chart operations",
    commands: [
      {
        trigger: "set alert [PAIR] [price] [condition]",
        what: "Price alert",
        detail: "Attempts to create a TradingView alert via automation. If DOM fails, gives you the manual steps.",
        example: "set alert AUDUSD 0.71600 crossing",
      },
      {
        trigger: "list alerts",
        what: "Active alerts",
        detail: "Shows all currently active TradingView price alerts.",
        example: "list alerts",
      },
      {
        trigger: "clear all alerts",
        what: "Reset alerts",
        detail: "Removes all existing alerts. Use at start of new week after reviewing.",
        example: "clear all alerts",
      },
      {
        trigger: "FVG zones [PAIR]",
        what: "Fair value gap levels",
        detail: "Reads Pine labels and zones from the FVG indicator on the active chart.",
        example: "FVG zones GOLD",
      },
    ],
  },
  {
    category: "Wiki & Logging",
    icon: "◇",
    color: "text-slate-600 bg-slate-100 border-slate-200",
    description: "Update and manage your trading operations wiki",
    commands: [
      {
        trigger: "add to agenda: [task]",
        what: "Running agenda",
        detail: "Adds an item to the Goals page agenda with a priority level.",
        example: "add to agenda: review EURUSD session timing — HIGH",
      },
      {
        trigger: "deploy wiki",
        what: "Push wiki changes live",
        detail: "Triggers a Vercel deployment of the trading wiki.",
        example: "deploy wiki",
      },
      {
        trigger: "weekly review",
        what: "Sunday performance review",
        detail: "Walks through the weekly review checklist: P&L, process scores, psych trend, FTMO shadow status, next week prep. Use Opus model.",
        example: "weekly review",
      },
      {
        trigger: "update shadow tracker: real P&L $[x]",
        what: "FTMO log",
        detail: "Computes shadow P&L (×1.25), updates running balance, flags if approaching soft or hard stops.",
        example: "update shadow tracker: real P&L $380",
      },
    ],
  },
  {
    category: "Claude Code Settings",
    icon: "⬡",
    color: "text-zinc-600 bg-zinc-100 border-zinc-200",
    description: "Type these directly into the Claude Code terminal (not as chat messages)",
    commands: [
      {
        trigger: "/effort max",
        what: "Extended thinking",
        detail: "Enables Claude's extended reasoning for complex analysis. Use for council sessions, trade reviews, system decisions. Costs more tokens.",
        example: "/effort max",
      },
      {
        trigger: "/compact",
        what: "Compress context",
        detail: "Summarises the full conversation into a compressed context and continues. Use when sessions get long (2hr+) or feel slow.",
        example: "/compact",
      },
      {
        trigger: "/model",
        what: "Switch AI model",
        detail: "Opens model selector. Switch to Opus for: LLM Council, weekly reviews, major strategic decisions. Switch back to Sonnet for routine work.",
        example: "/model → select Claude Opus",
      },
      {
        trigger: "/clear",
        what: "Fresh session",
        detail: "Clears conversation and starts fresh. Use when changing topics entirely — e.g. moving from market reads to wiki building.",
        example: "/clear",
      },
    ],
  },
];

export default function CommandsPage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reference</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Command Prompts</h1>
        <p className="text-sm text-slate-500 mt-1">Exactly what to type — for every action, activity, and workflow</p>
      </div>

      {/* How to use */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <p className="text-sm font-semibold text-amber-700 mb-1">How to use this page</p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Type the trigger phrase into Claude Code (or Claude.ai) exactly as shown. Claude reads your{" "}
          <code className="text-xs bg-amber-100 border border-amber-200 rounded px-1 py-0.5 font-mono">CLAUDE.md</code> at session start,
          so it already knows your account, rules, and hard stops — you don&apos;t need to re-explain them.
          Commands in the <span className="font-semibold">Claude Code Settings</span> section start with <code className="text-xs bg-amber-100 border border-amber-200 rounded px-1 py-0.5 font-mono">/</code> — type those directly into the terminal, not as chat messages.
        </p>
      </div>

      {/* Model reminder */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-amber-500 text-lg flex-shrink-0">⚠</span>
        <div>
          <p className="text-sm font-semibold text-slate-700">Switch to Opus for council, weekly reviews, and major decisions</p>
          <p className="text-xs text-slate-500 mt-0.5">Type <code className="font-mono bg-slate-100 px-1 rounded">/model</code> → select Claude Opus. Switch back to Sonnet for routine session work.</p>
        </div>
      </div>

      {/* Command groups */}
      <div className="space-y-6">
        {commandGroups.map((group) => (
          <div key={group.category} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Group header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <span className={`text-[10px] font-bold rounded px-2 py-0.5 border ${group.color}`}>{group.icon} {group.category}</span>
              <p className="text-xs text-slate-400">{group.description}</p>
            </div>

            {/* Commands */}
            <div className="divide-y divide-slate-100">
              {group.commands.map((cmd) => (
                <div key={cmd.trigger} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <code className="text-sm font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 whitespace-nowrap">
                          {cmd.trigger}
                        </code>
                        <span className="text-xs text-slate-400">{cmd.what}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{cmd.detail}</p>
                    </div>
                  </div>
                  {/* Example */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">Example:</span>
                    <code className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                      {cmd.example}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Token tip */}
      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Token efficiency tips</p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { do: "15:00 check", dont: "Can you please check the charts and tell me if there are any setups?" },
            { do: "signal check GOLD", dont: "What does the GOLD chart look like right now, is there a trade?" },
            { do: "council this: [clear question]", dont: "What do you think about maybe changing my approach to..." },
            { do: "/compact (when session is long)", dont: "Continuing a 3-hour session that's slowing down" },
          ].map((tip, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-emerald-500 font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
                <code className="text-xs font-mono text-slate-700">{tip.do}</code>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 font-bold text-xs flex-shrink-0 mt-0.5">✗</span>
                <p className="text-xs text-slate-400 italic">{tip.dont}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WikiLayout>
  );
}
