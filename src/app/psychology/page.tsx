import WikiLayout from "@/components/WikiLayout";

const scoreGuide = [
  { score: "5", label: "Calm / Focused", description: "Fully present, no emotional charge. Execute like a machine. Target state.", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { score: "4", label: "Settled",        description: "Minor background noise but fully functional. Conditions are green.",         color: "text-blue-700 bg-blue-50 border-blue-200" },
  { score: "3", label: "Neutral",        description: "Default acceptable state. Neither optimal nor impaired. Proceed.",           color: "text-slate-600 bg-slate-100 border-slate-200" },
  { score: "2", label: "Elevated stress",description: "Noticeable emotional pull. A+ only at T1 if you trade at all.",              color: "text-amber-700 bg-amber-50 border-amber-200" },
  { score: "1", label: "Stressed",       description: "Do NOT enter. Watch only. Log the score and close.",                         color: "text-red-700 bg-red-50 border-red-200" },
];

const traps = [
  { trap: "Revenge trading",           trigger: "Loss followed by urge to re-enter",                  rule: "2-loss rule: after 2 losses, platform closes. Non-negotiable." },
  { trap: "Pressure to enter",         trigger: "\"I haven't traded all week\" feeling",               rule: "The trade either exists or it doesn't. Waiting IS the trade." },
  { trap: "Overriding invalidation",   trigger: "Price hits written level but you rationalise staying",rule: "The written line is the authority. Not your opinion in the moment." },
  { trap: "Widening the SL",           trigger: "\"Just give it a bit more room\"",                    rule: "SL is set before entry. It doesn't move outward. Ever." },
  { trap: "Moving targets early",      trigger: "Fear of giving back open profit",                     rule: "Exit at target or SL. No discretionary exits between." },
  { trap: "FOMO entry",                trigger: "Price running without you after missing signal",       rule: "Past the entry window = no trade. Wait for tomorrow." },
];

const postFields = ["Scenario confirmed?", "All 4 conditions met?", "Tier chosen BEFORE entry?", "News checked?", "Spread checked?", "BE rule at correct R?", "Exited at target or SL?"];

export default function PsychologyPage() {
  return (
    <WikiLayout>
      <div className="mb-8">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mental game</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Psychology</h1>
        <p className="text-sm text-slate-500 mt-1">Emotional state · Session log · Common traps</p>
      </div>

      {/* Core principle */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <p className="text-sm text-slate-700 leading-relaxed">
          &ldquo;Process score of 7/7 is the win. P&L follows from the process. You cannot control whether a trade profits. You can control whether you followed the rules.&rdquo;
        </p>
      </div>

      {/* Score guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-1">Psychology Score Guide</h2>
        <p className="text-xs text-slate-400 mb-4">Rate at 3 checkpoints: pre-session (15:00–15:30), during trade, at exit. Score each 1–5.</p>
        <div className="space-y-2">
          {scoreGuide.map((s) => (
            <div key={s.score} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base font-bold font-mono border ${s.color}`}>{s.score}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">
            <span className="font-semibold">Hard rule:</span> Pre-session score of 1 = do not enter any trade. Watch only. Log the score. Not a suggestion.
          </p>
        </div>
      </div>

      {/* Post-session log */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Post-Session Log</h2>
          <span className="text-[10px] text-slate-400">Complete within 10 min of closing platform</span>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Field 1 — Process Score</p>
            <div className="space-y-1.5">
              {postFields.map((f) => (
                <div key={f} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{f}</span>
                  <span className="text-slate-400 font-mono">Yes / No</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Process Score</span>
              <span className="text-amber-600 font-mono font-bold">___ / 7</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Field 2 — Emotional State</p>
            <div className="space-y-1.5 mb-3">
              {["Pre-session (15:00–15:30)", "During trade", "At exit"].map((r) => (
                <div key={r} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{r}</span>
                  <span className="text-slate-400 font-mono">1  2  3  4  5</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-200 space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Psychology Reflection</p>
              {["Overall psych score: ___ / 5", "Followed process?: Y/N", "Pressure to enter/re-enter?: Y/N", "Revenge traded / broke 2-loss rule?: Y/N"].map((l, i) => (
                <p key={i} className="text-[11px] text-slate-500 font-mono">{l}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Field 3 — One Lesson</p>
          <div className="grid md:grid-cols-2 gap-3 text-xs">
            <div><span className="text-emerald-600 font-bold">REPEAT:</span><p className="text-slate-400 mt-1 italic">What worked today that I should do again?</p></div>
            <div><span className="text-red-600 font-bold">AVOID:</span><p className="text-slate-400 mt-1 italic">What cost me discipline or focus?</p></div>
          </div>
        </div>
      </div>

      {/* Traps */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Common Psychological Traps</h2>
        <div className="space-y-2">
          {traps.map((t) => (
            <div key={t.trap} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-800 mb-1">{t.trap}</p>
              <p className="text-xs mb-1"><span className="text-slate-400">Trigger: </span><span className="text-slate-500 italic">{t.trigger}</span></p>
              <p className="text-xs"><span className="text-amber-600 font-semibold">Rule: </span><span className="text-slate-600">{t.rule}</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Mental models */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Mental Models</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: "The trade either exists or it doesn't", body: "You are not creating opportunity by watching harder. If the setup isn't there, waiting is the correct action. Inaction on a bad setup is a win." },
            { title: "Outcome vs process",                    body: "A profitable trade following bad process = a dangerous win. A losing trade following perfect process = a good loss. Score the process, not the P&L." },
            { title: "The 2-loss rule is your firewall",      body: "Two losses back-to-back is data: the session is not in your favour. The rule removes discretion from a moment when discretion is most dangerous." },
          ].map((m) => (
            <div key={m.title} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2 leading-snug">{m.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </div>
    </WikiLayout>
  );
}
