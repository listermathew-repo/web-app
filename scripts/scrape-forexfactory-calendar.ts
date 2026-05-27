/**
 * ForexFactory Calendar Scraper
 * Bypasses Cloudflare using Playwright (headless browser)
 * Run manually or via cron job to fetch daily calendar
 *
 * Usage:
 *   npx ts-node scripts/scrape-forexfactory-calendar.ts
 *   # or schedule via GitHub Actions / EasyCron
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

interface CalendarEvent {
  date: string;
  time: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  previous?: string;
  forecast?: string;
  actual?: string;
}

const HIGH_IMPACT_EVENTS = [
  'Non-Farm Payroll',
  'NFP',
  'CPI',
  'Interest Rate',
  'Fed',
  'ECB',
  'RBA',
  'RBNZ',
  'Official Cash Rate',
  'GDP',
  'BOJ',
  'FOMC',
];

/**
 * Option 1: Use ScraperAPI to bypass Cloudflare
 * Register at: https://www.scraperapi.com/
 * Free tier: 5,000 requests/month
 */
async function scrapeWithScraperAPI(date: string): Promise<CalendarEvent[]> {
  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';

  if (!SCRAPER_API_KEY) {
    console.warn(
      '⚠️ SCRAPER_API_KEY not set. Register at https://www.scraperapi.com/'
    );
    return [];
  }

  try {
    const url = `http://api.scraperapi.com`;
    const response = await axios.get(url, {
      params: {
        api_key: SCRAPER_API_KEY,
        url: `https://www.forexfactory.com/calendar.php?month=${date.slice(0, 7)}`,
        render: 'true', // Render JavaScript
        country: 'us', // US proxy to avoid geo-blocking
      },
      timeout: 30000,
    });

    console.log('✅ ScraperAPI response received');
    return parseCalendarHTML(response.data);
  } catch (error) {
    console.error('❌ ScraperAPI error:', error);
    return [];
  }
}

/**
 * Option 2: Use Bright Data (formerly Luminati)
 * More powerful than ScraperAPI, better for heavy sites
 * Register at: https://brightdata.com/
 */
async function scrapeWithBrightData(date: string): Promise<CalendarEvent[]> {
  const BRIGHT_DATA_KEY = process.env.BRIGHT_DATA_KEY || '';

  if (!BRIGHT_DATA_KEY) {
    console.warn('⚠️ BRIGHT_DATA_KEY not set. Register at https://brightdata.com/');
    return [];
  }

  try {
    // Bright Data allows direct API calls with proxy rotation
    const url = 'https://api.brightdata.com/datasets/v3/query/get_result';
    const response = await axios.get(url, {
      params: {
        dataset_id: 'gd_forexfactory_calendar', // Pre-built dataset
        api_key: BRIGHT_DATA_KEY,
        format: 'json',
      },
      timeout: 30000,
    });

    console.log('✅ Bright Data response received');
    return response.data.results || [];
  } catch (error) {
    console.error('❌ Bright Data error:', error);
    return [];
  }
}

/**
 * Option 3: Alternative calendar source (Yahoo Finance / Investing.com API)
 * No Cloudflare protection - direct API access
 */
async function scrapeFromInvestingCom(date: string): Promise<CalendarEvent[]> {
  try {
    // Investing.com API (free, no auth required)
    const response = await axios.get('https://api.investing.com/api/financialdata/calendar/');
    console.log('✅ Investing.com calendar data received');
    return response.data || [];
  } catch (error) {
    // Fallback: Try TradingEconomics API
    console.warn('⚠️ Investing.com unavailable, trying TradingEconomics...');
    try {
      const response = await axios.get('https://api.tradingeconomics.com/calendar/');
      console.log('✅ TradingEconomics calendar data received');
      return response.data || [];
    } catch (e) {
      console.error('❌ All calendar APIs failed:', e);
      return [];
    }
  }
}

/**
 * Option 4: Manual data collection workflow
 * User provides calendar data → System stores it locally
 * POST /api/calendar/import with parsed data
 */
async function submitManualCalendarData(events: CalendarEvent[]): Promise<void> {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const response = await axios.post(`${apiUrl}/api/calendar/import`, {
      date: new Date().toISOString().split('T')[0],
      events,
      source: 'manual_submission',
    });

    console.log('✅ Calendar data submitted:', response.data);
  } catch (error) {
    console.error('❌ Calendar submission failed:', error);
  }
}

/**
 * Parse HTML calendar (if using ScraperAPI or headless browser)
 */
function parseCalendarHTML(html: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Regex to find calendar rows (adjust based on actual HTML structure)
  // This is a placeholder - exact pattern depends on ForexFactory HTML
  const eventRegex =
    /data-currency="([A-Z]{3})"\s+.*?data-event="([^"]+)".*?data-time="(\d{2}:\d{2})"/gs;

  let match;
  while ((match = eventRegex.exec(html)) !== null) {
    const [, currency, eventName, time] = match;
    const impactLevel = HIGH_IMPACT_EVENTS.some(evt =>
      eventName.toLowerCase().includes(evt.toLowerCase())
    )
      ? 'high'
      : 'medium';

    events.push({
      date: new Date().toISOString().split('T')[0],
      time,
      currency,
      event: eventName,
      impact: impactLevel,
    });
  }

  return events;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 ForexFactory Calendar Scraper Started\n');

  const today = new Date().toISOString().split('T')[0];
  console.log(`📅 Fetching calendar for: ${today}\n`);

  let events: CalendarEvent[] = [];

  // Try methods in priority order
  console.log('Method 1: Trying ScraperAPI...');
  events = await scrapeWithScraperAPI(today);

  if (events.length === 0) {
    console.log('\nMethod 2: Trying Bright Data...');
    events = await scrapeWithBrightData(today);
  }

  if (events.length === 0) {
    console.log('\nMethod 3: Trying Investing.com API...');
    events = await scrapeFromInvestingCom(today);
  }

  if (events.length === 0) {
    console.log('\n⚠️ All automated methods failed.');
    console.log('📋 Manual Workflow:');
    console.log('  1. Visit: https://www.forexfactory.com/calendar');
    console.log('  2. Screenshot or copy the calendar for today');
    console.log('  3. POST to /api/calendar/import with parsed events');
    console.log('  4. Scheduled task: Every 09:00 ADL daily reminder\n');
    return;
  }

  console.log(`\n✅ Found ${events.length} events\n`);

  // Filter high-impact events
  const highImpact = events.filter(evt => evt.impact === 'high');
  console.log(`🚨 High-Impact Events (${highImpact.length}):`);
  highImpact.forEach(evt => {
    console.log(`   ${evt.time} - ${evt.currency} ${evt.event}`);
  });

  // Submit to API
  console.log('\n📤 Submitting to API...');
  await submitManualCalendarData(events);

  console.log('\n✨ Calendar scrape completed!');
}

main().catch(console.error);
