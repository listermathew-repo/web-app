/**
 * POST /api/pulse/approve
 * User approves a detected setup to begin stage progression
 * Setup moves from "detected" → "standby" and begins 10M monitoring
 *
 * Request body:
 * {
 *   "setup_id": "setup-uuid",
 *   "notes": "optional user notes"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedPulseEngine } from '@/lib/advanced-pulse-engine';
import { sendAlert } from '@/lib/alerts';

interface ApprovalRequest {
  setup_id: string;
  notes?: string;
}

interface ApprovalResponse {
  success: boolean;
  setup_id: string;
  status: string;
  stage: string;
  progress: string;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ApprovalRequest;
    const { setup_id, notes } = body;

    if (!setup_id) {
      return NextResponse.json<ApprovalResponse>(
        {
          success: false,
          setup_id: '',
          status: 'error',
          stage: '',
          progress: '',
          message: '',
          error: 'setup_id is required',
        },
        { status: 400 }
      );
    }

    const engine = getAdvancedPulseEngine();
    const setup = await engine.userApprovesSetup(setup_id);

    if (!setup) {
      return NextResponse.json<ApprovalResponse>(
        {
          success: false,
          setup_id,
          status: 'error',
          stage: '',
          progress: '',
          message: '',
          error: 'Setup not found',
        },
        { status: 404 }
      );
    }

    // Build progress message
    const progressMap: Record<string, string> = {
      standby: '✓ Approved - monitoring 10M for impulsive move + pullback',
      ready: '✓ 10M confirmed - monitoring 5M for value area',
      signal_ready: '✓ Entry window open - monitoring 3M for entry candle',
      trigger_ready: '🎯 STANDBY - waiting for 2M/1M final confirmation',
      executing: '⚡ Executing trade...',
      executed: '✅ Trade executed',
    };

    const progressMsg = progressMap[setup.stage] || 'Unknown stage';

    // Send confirmation alert
    await sendAlert({
      type: 'success',
      message: `✅ SETUP APPROVED - ${setup.symbol} ${setup.direction.toUpperCase()}

User approved to begin stage progression.

STAGES AHEAD:
  1. 10M Confirmation: Impulsive move + pullback
  2. 5M Value Area: Price into FVG, RSI/VWAP aligned
  3. 3M Entry Candle: Exact entry candle confirmation
  4. 2M/1M Trigger: Final confirmation → EXECUTE

Entry valid for: 15 minutes from 5M confirmation
Risk: $${setup.riskAmount} | Reward: $${setup.rewardAmount}
${notes ? `\nNotes: ${notes}` : ''}
    `,
      tags: ['setup', 'approved']
    });

    return NextResponse.json<ApprovalResponse>(
      {
        success: true,
        setup_id,
        status: 'approved',
        stage: setup.stage,
        progress: progressMsg,
        message: `Setup approved. Now monitoring 10M for impulsive move + pullback structure.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[APPROVE] Error:', error);

    const errorMsg = error instanceof Error ? error.message : String(error);
    await sendAlert({ type: 'error', message: `🔴 APPROVAL ERROR: ${errorMsg}`, tags: ['approval', 'error'] });

    return NextResponse.json<ApprovalResponse>(
      {
        success: false,
        setup_id: '',
        status: 'error',
        stage: '',
        progress: '',
        message: '',
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
