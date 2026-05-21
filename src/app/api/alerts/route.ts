/**
 * API Endpoint: /api/alerts
 * Purpose: Serve dynamic alert levels from rules.json
 * Used by: Pine Script (MCP Dynamic Alerts indicator)
 *
 * Endpoint: GET https://your-deployment.vercel.app/api/alerts
 * Response: JSON with alert levels for EURUSD, XAUUSD, BTCUSD
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  // Enable CORS for Pine Script requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  try {
    // Resolve path to rules.json
    // In Vercel deployment, rules.json should be in the project root
    const rulesPath = path.join(process.cwd(), 'rules.json');

    // Check if file exists
    if (!fs.existsSync(rulesPath)) {
      return NextResponse.json(
        {
          error: 'rules.json not found',
          path: rulesPath,
          hint: 'Ensure rules.json exists in project root',
        },
        { status: 404, headers }
      );
    }

    // Read and parse rules.json
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
    const rules = JSON.parse(rulesContent);

    // Extract alert levels from rules.json
    const alertData = {
      status: 'success',
      timestamp: new Date().toISOString(),
      eurusd: {
        breakout: rules.alert_levels?.eurusd?.alerts?.[0]?.level || 1.16353,
        retap: rules.alert_levels?.eurusd?.alerts?.[1]?.level || 1.16260,
        stop: rules.alert_levels?.eurusd?.alerts?.[2]?.level || 1.1617,
        breakout_type: rules.alert_levels?.eurusd?.alerts?.[0]?.type,
        retap_type: rules.alert_levels?.eurusd?.alerts?.[1]?.type,
        stop_type: rules.alert_levels?.eurusd?.alerts?.[2]?.type,
      },
      xauusd: {
        breakout: rules.alert_levels?.xauusd?.alerts?.[0]?.level || 4570.895,
        retap: rules.alert_levels?.xauusd?.alerts?.[1]?.level || 4555,
        stop: rules.alert_levels?.xauusd?.alerts?.[2]?.level || 4534.74,
        breakout_type: rules.alert_levels?.xauusd?.alerts?.[0]?.type,
        retap_type: rules.alert_levels?.xauusd?.alerts?.[1]?.type,
        stop_type: rules.alert_levels?.xauusd?.alerts?.[2]?.type,
      },
      btcusd: {
        breakout: rules.alert_levels?.btcusd?.alerts?.[0]?.level || 78103,
        retap: rules.alert_levels?.btcusd?.alerts?.[1]?.level || 77950,
        stop: rules.alert_levels?.btcusd?.alerts?.[2]?.level || 77155,
        breakout_type: rules.alert_levels?.btcusd?.alerts?.[0]?.type,
        retap_type: rules.alert_levels?.btcusd?.alerts?.[1]?.type,
        stop_type: rules.alert_levels?.btcusd?.alerts?.[2]?.type,
      },
      risk_management: {
        risk_per_trade: rules.entry_conditions?.risk_management?.risk_per_trade,
        min_r_multiple: rules.entry_conditions?.risk_management?.minimum_r_multiple,
        target_r_multiple: rules.entry_conditions?.risk_management?.target_r_multiple,
      },
      trading_window: {
        start: rules.trading_window?.start_time,
        end: rules.trading_window?.end_time,
        timezone: rules.trading_window?.timezone,
      },
    };

    // Return alert levels
    return NextResponse.json(alertData, { status: 200, headers });
  } catch (error) {
    console.error('Error in /api/alerts:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to read alert levels',
        message: errorMessage,
        hint: 'Check that rules.json is valid JSON and in the correct location',
      },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  return new NextResponse(null, { status: 200, headers });
}
