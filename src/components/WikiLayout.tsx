"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard",      href: "/",          icon: "⬡", description: "Daily agenda & session prep" },
  { label: "Trading Rules",  href: "/rules",     icon: "◎", description: "MAF system, conditions, tiers" },
  { label: "Prop Firm Plan", href: "/ftmo",      icon: "◈", description: "Shadow tracker & multi-account strategy" },
  { label: "Psychology",     href: "/psychology",icon: "◉", description: "Mental state & session logs" },
  { label: "Goals",          href: "/goals",     icon: "◇", description: "90-day targets & achievements" },
  { label: "Aristotle",      href: "/aristotle", icon: "◆", description: "First principles deconstructor" },
  { label: "Commands",       href: "/commands",  icon: "⌘", description: "What to type — every action" },
];

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-slate-200 z-30 flex flex-col shadow-sm transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 text-sm">◈</div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-none">Trading HQ</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Private · Restricted</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{today}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group
                      ${isActive
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium leading-none">{item.label}</p>
                      <p className={`text-[10px] mt-0.5 leading-none truncate ${isActive ? "text-amber-500" : "text-slate-400"}`}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-slate-100 my-3" />

          {/* Session times */}
          <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Session window</p>
            <div className="space-y-1">
              {[
                { label: "Signal check", time: "15:00", highlight: true },
                { label: "London open",  time: "15:30", highlight: true },
                { label: "Window closes",time: "17:00", highlight: false },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-[11px]">
                  <span className="text-slate-500">{s.label}</span>
                  <span className={`font-mono font-semibold ${s.highlight ? "text-amber-600" : "text-slate-400"}`}>{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Sign out ↗
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="text-slate-500 hover:text-slate-800 p-1">☰</button>
          <span className="text-sm font-semibold text-slate-800">Trading HQ</span>
        </div>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
