"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, AlertTriangle, Clock } from "lucide-react";

interface EconomicEvent {
  id: string;
  country: string;
  event: string;
  impact: "high" | "medium" | "low";
  time: string; // ISO format
  forecast: string;
  previous: string;
  currency?: string;
}

const HIGH_IMPACT_EVENTS = [
  "Non-Farm Payroll (NFP)",
  "Unemployment Rate",
  "Consumer Price Index (CPI)",
  "Inflation Rate",
  "Interest Rate Decision",
  "GDP",
  "Retail Sales",
  "Producer Price Index (PPI)",
  "Trade Balance",
];

export default function EconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradingPausedUntil, setTradingPausedUntil] = useState<string | null>(null);

  const fetchEconomicEvents = useCallback(async () => {
    try {
      // For now, use mock data. In production, integrate with:
      // - ForexFactory API
      // - Investing.com calendar
      // - TradingEconomics API
      const now = new Date();

      // Mock high-impact events for today and tomorrow
      const mockEvents: EconomicEvent[] = [
        {
          id: "1",
          country: "US",
          event: "Non-Farm Payroll (NFP)",
          impact: "high",
          time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          forecast: "250K",
          previous: "275K",
        },
        {
          id: "2",
          country: "US",
          event: "Unemployment Rate",
          impact: "high",
          time: new Date(now.getTime() + 2.25 * 60 * 60 * 1000).toISOString(),
          forecast: "4.0%",
          previous: "4.1%",
        },
        {
          id: "3",
          country: "EU",
          event: "Interest Rate Decision",
          impact: "high",
          time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
          forecast: "3.75%",
          previous: "3.75%",
        },
        {
          id: "4",
          country: "UK",
          event: "Retail Sales",
          impact: "medium",
          time: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          forecast: "-0.1%",
          previous: "0.3%",
        },
      ];

      setEvents(mockEvents);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch economic calendar:", error);
      setLoading(false);
    }
  }, []);

  const computeTradesPausedStatus = useCallback((): string | null => {
    const now = new Date();
    const pauseWindowMinutes = 15;

    // Find upcoming high-impact events
    for (const event of events) {
      if (HIGH_IMPACT_EVENTS.some((e) => event.event.includes(e)) && event.impact === "high") {
        const eventTime = new Date(event.time);
        const timeDiff = eventTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        // Pause if within 15 min before or 15 min after
        if (minutesDiff > -pauseWindowMinutes && minutesDiff < pauseWindowMinutes) {
          return `Trading paused for ${event.event}`;
        }
      }
    }

    return null;
  }, [events]);

  useEffect(() => {
    fetchEconomicEvents();
    const interval = setInterval(fetchEconomicEvents, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchEconomicEvents]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTradingPausedUntil(computeTradesPausedStatus());
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [computeTradesPausedStatus]);

  const getTimeUntil = (eventTime: string) => {
    const now = new Date();
    const event = new Date(eventTime);
    const diffMs = event.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    if (diffMins > 0) return `${diffMins}m`;
    return "Now";
  };

  const isHighImpactEvent = (eventName: string) => {
    return HIGH_IMPACT_EVENTS.some((e) => eventName.includes(e));
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
          📅 Economic Calendar
        </h2>
        <div className="text-center text-slate-400 py-4">Loading events...</div>
      </div>
    );
  }

  const highImpactEvents = events.filter((e) => e.impact === "high" && isHighImpactEvent(e.event));
  const mediumImpactEvents = events.filter((e) => e.impact === "medium");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
        📅 Economic Calendar
      </h2>

      {/* Trading Paused Banner */}
      {tradingPausedUntil && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900">⏸ {tradingPausedUntil}</p>
            <p className="text-[11px] text-red-700">Trading paused 15 min before/after high-impact events</p>
          </div>
        </div>
      )}

      {/* High Impact Events */}
      {highImpactEvents.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-red-600 uppercase mb-2 flex items-center gap-1">
            <AlertTriangle size={12} /> High Impact
          </p>
          <div className="space-y-2">
            {highImpactEvents.map((event) => (
              <div key={event.id} className="border border-red-200 bg-red-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{event.event}</p>
                    <p className="text-[11px] text-slate-500">{event.country}</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-end whitespace-nowrap">
                      <Clock size={12} /> {getTimeUntil(event.time)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <p className="text-slate-500">Forecast</p>
                    <p className="font-mono font-semibold text-slate-900">{event.forecast}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Previous</p>
                    <p className="font-mono font-semibold text-slate-900">{event.previous}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Impact</p>
                    <p className="font-semibold text-red-600">●●● HIGH</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medium Impact Events */}
      {mediumImpactEvents.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-amber-600 uppercase mb-2 flex items-center gap-1">
            <TrendingUp size={12} /> Medium Impact
          </p>
          <div className="space-y-1.5">
            {mediumImpactEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="border border-amber-200 bg-amber-50 rounded-lg p-2.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{event.event}</p>
                    <p className="text-slate-500">{event.country}</p>
                  </div>
                  <p className="font-mono font-semibold text-slate-900 whitespace-nowrap ml-2">
                    {getTimeUntil(event.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center text-slate-400 py-4 text-sm">No events scheduled</div>
      )}
    </div>
  );
}
