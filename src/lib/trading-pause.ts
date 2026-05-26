/**
 * Trading Pause Logic - Prevents trading during high-impact economic events
 * Pauses trading 15 minutes before and after high-impact events
 */

interface EconomicEvent {
  event: string;
  impact: "high" | "medium" | "low";
  time: string; // ISO format
}

// High-impact events that trigger trading pause
const HIGH_IMPACT_EVENTS = [
  "Non-Farm Payroll",
  "NFP",
  "Unemployment Rate",
  "Consumer Price Index",
  "CPI",
  "Inflation Rate",
  "Interest Rate Decision",
  "Federal Reserve",
  "FOMC",
  "GDP",
  "Retail Sales",
  "Producer Price Index",
  "PPI",
  "Trade Balance",
  "Initial Jobless Claims",
];

// In-memory cache of economic events
let cachedEvents: EconomicEvent[] = [];
let lastEventFetch = 0;
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Get current list of economic events
 * Uses mock data for now; integrate with real API later
 */
export function getEconomicEvents(): EconomicEvent[] {
  // For now, return mock events
  // In production, fetch from ForexFactory, Investing.com, or TradingEconomics API
  const now = new Date();

  return [
    {
      event: "Non-Farm Payroll (NFP)",
      impact: "high",
      time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      event: "Interest Rate Decision",
      impact: "high",
      time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      event: "Consumer Price Index (CPI)",
      impact: "high",
      time: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Check if trading is currently paused due to high-impact economic events
 * Returns { isPaused: boolean, reason?: string, resumesAt?: string }
 */
export function isTradingPaused(): {
  isPaused: boolean;
  reason?: string;
  resumesAt?: string;
  minutesUntilResume?: number;
} {
  const now = new Date();
  const pauseWindowMinutes = 15;
  const events = getEconomicEvents();

  for (const event of events) {
    // Only check high-impact events
    if (event.impact !== "high") continue;

    // Check if event name matches high-impact keywords
    const isHighImpact = HIGH_IMPACT_EVENTS.some((keyword) =>
      event.event.toUpperCase().includes(keyword.toUpperCase())
    );

    if (!isHighImpact) continue;

    const eventTime = new Date(event.time);
    const timeDiffMs = eventTime.getTime() - now.getTime();
    const timeDiffMinutes = timeDiffMs / (1000 * 60);

    // Pause if within 15 min before or 15 min after
    if (timeDiffMinutes > -pauseWindowMinutes && timeDiffMinutes < pauseWindowMinutes) {
      const resumeTime = new Date(eventTime.getTime() + pauseWindowMinutes * 60 * 1000);

      return {
        isPaused: true,
        reason: `High-impact event: ${event.event}`,
        resumesAt: resumeTime.toISOString(),
        minutesUntilResume: Math.ceil((resumeTime.getTime() - now.getTime()) / (1000 * 60)),
      };
    }
  }

  return { isPaused: false };
}

/**
 * Get next high-impact event
 */
export function getNextHighImpactEvent(): EconomicEvent | null {
  const now = new Date();
  const events = getEconomicEvents();

  const futureEvents = events
    .filter((e) => e.impact === "high")
    .filter((e) => {
      const isHighImpact = HIGH_IMPACT_EVENTS.some((keyword) =>
        e.event.toUpperCase().includes(keyword.toUpperCase())
      );
      return isHighImpact;
    })
    .filter((e) => new Date(e.time) > now)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return futureEvents[0] || null;
}

/**
 * Format pause status for API response
 */
export function getPauseStatus() {
  const pauseStatus = isTradingPaused();

  if (pauseStatus.isPaused) {
    return {
      trading_paused: true,
      reason: pauseStatus.reason,
      resumes_at: pauseStatus.resumesAt,
      minutes_until_resume: pauseStatus.minutesUntilResume,
    };
  }

  const nextEvent = getNextHighImpactEvent();
  if (nextEvent) {
    const timeDiff = new Date(nextEvent.time).getTime() - new Date().getTime();
    const minutesUntil = Math.ceil(timeDiff / (1000 * 60));

    return {
      trading_paused: false,
      next_event: nextEvent.event,
      next_event_in_minutes: minutesUntil,
    };
  }

  return {
    trading_paused: false,
  };
}
