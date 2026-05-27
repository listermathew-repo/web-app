/**
 * Economic Calendar Import Endpoint
 * Accepts manual calendar data (bypasses Cloudflare by storing locally)
 * Also provides alternative data sources (Yahoo Finance, Investing.com APIs)
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CalendarEvent {
  date: string; // ISO format
  time: string; // HH:MM ADL
  timezone: 'AUD' | 'NZD' | 'EUR' | 'USD' | 'JPY' | 'CHF' | 'CNY';
  event: string;
  impact: 'high' | 'medium' | 'low';
  previous?: string;
  forecast?: string;
  actual?: string;
  notes?: string;
}

interface CalendarData {
  date: string;
  source: 'manual' | 'yahoo' | 'investing' | 'tradingeconomics';
  events: CalendarEvent[];
  lastUpdated: string;
}

const CALENDAR_FILE = path.join(process.cwd(), '.db', 'economic_calendar.json');

// High-impact events that trigger trading pause
const HIGH_IMPACT_EVENTS = [
  'Non-Farm Payroll',
  'NFP',
  'CPI',
  'Consumer Price Index',
  'Interest Rate Decision',
  'Fed Decision',
  'ECB Decision',
  'RBA Decision',
  'RBNZ Rate',
  'Official Cash Rate',
  'GDP',
  'Gross Domestic Product',
  'BOJ',
  'Bank of Japan',
  'FOMC',
];

/**
 * POST /api/calendar/import
 * Accept calendar data from user (ForexFactory screenshot parsed manually)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, events, source = 'manual' } = body;

    if (!date || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing date or events array' },
        { status: 400 }
      );
    }

    // Validate and normalize events
    const normalizedEvents: CalendarEvent[] = events.map((evt: Record<string, unknown>) => ({
      date,
      time: evt.time || evt.timeADL || '',
      timezone: evt.timezone || evt.currency || 'USD',
      event: evt.event || evt.name || '',
      impact: detectImpact(evt.event || evt.name || ''),
      previous: evt.previous || evt.prev || undefined,
      forecast: evt.forecast || evt.est || undefined,
      actual: evt.actual || undefined,
      notes: evt.notes || undefined,
    }));

    // Save to local database
    const calendarData: CalendarData = {
      date,
      source,
      events: normalizedEvents,
      lastUpdated: new Date().toISOString(),
    };

    // Ensure .db directory exists
    const dbDir = path.dirname(CALENDAR_FILE);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Read existing calendar or create new
    let existingCalendar = [];
    if (fs.existsSync(CALENDAR_FILE)) {
      const data = fs.readFileSync(CALENDAR_FILE, 'utf-8');
      existingCalendar = JSON.parse(data);
    }

    // Add new events (avoid duplicates by date)
    existingCalendar = existingCalendar.filter((cal: CalendarData) => cal.date !== date);
    existingCalendar.push(calendarData);
    existingCalendar.sort((a: CalendarData, b: CalendarData) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Write back to file
    fs.writeFileSync(CALENDAR_FILE, JSON.stringify(existingCalendar, null, 2));

    // Extract high-impact events for trading pause
    const highImpactEvents = normalizedEvents.filter(evt => evt.impact === 'high');

    return NextResponse.json({
      status: 'imported',
      date,
      eventsCount: normalizedEvents.length,
      highImpactCount: highImpactEvents.length,
      highImpactEvents: highImpactEvents.map(evt => ({
        time: evt.time,
        event: evt.event,
        timezone: evt.timezone,
      })),
      message: `Calendar for ${date} imported successfully. ${highImpactEvents.length} high-impact events detected.`,
    });
  } catch (error) {
    console.error('[CALENDAR] Import error:', error);
    return NextResponse.json(
      { error: 'Calendar import failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/import
 * Retrieve calendar data for a specific date or date range
 */
export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date');
    const days = parseInt(request.nextUrl.searchParams.get('days') || '7');

    if (!fs.existsSync(CALENDAR_FILE)) {
      return NextResponse.json({ events: [], message: 'No calendar data available' });
    }

    const data = fs.readFileSync(CALENDAR_FILE, 'utf-8');
    const allCalendars = JSON.parse(data) as CalendarData[];

    if (date) {
      // Single date
      const calendar = allCalendars.find(cal => cal.date === date);
      return NextResponse.json(calendar || { date, events: [], message: 'No events for this date' });
    }

    // Date range (next N days)
    const today = new Date();
    const futureCalendars = allCalendars.filter(cal => {
      const calDate = new Date(cal.date);
      const daysAhead = Math.floor((calDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysAhead >= 0 && daysAhead < days;
    });

    return NextResponse.json({
      range: `Next ${days} days`,
      count: futureCalendars.length,
      calendars: futureCalendars,
    });
  } catch (error) {
    console.error('[CALENDAR] Retrieval error:', error);
    return NextResponse.json(
      { error: 'Calendar retrieval failed' },
      { status: 500 }
    );
  }
}

/**
 * Detect impact level from event name
 */
function detectImpact(eventName: string): 'high' | 'medium' | 'low' {
  const name = eventName.toLowerCase();

  // High impact events
  if (HIGH_IMPACT_EVENTS.some(evt => name.includes(evt.toLowerCase()))) {
    return 'high';
  }

  // Medium impact
  const mediumEvents = [
    'employment',
    'unemployment',
    'retail sales',
    'manufacturing',
    'pmi',
    'inflation',
    'wage',
    'housing',
    'construction',
    'leading index',
  ];
  if (mediumEvents.some(evt => name.includes(evt))) {
    return 'medium';
  }

  return 'low';
}
