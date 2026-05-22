/**
 * Trade Logger Utility
 * Logs completed trades with full metadata for backtesting analysis
 */

import { dbOps } from './db';

export interface TradeLog {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entry_time: string; // "HH:MM ADL"
  exit_time: string; // "HH:MM ADL"
  entry_price: number;
  exit_price: number;
  stop_price: number;
  rr_target: number; // 1.5, 2.0, 3.0, etc.
  actual_rr_achieved: number; // Calculated from exit price
  position_size: number; // Lot size
  risk_amount: number; // USD per trade
  pnl: number; // Profit/Loss in USD
  win_loss: 'win' | 'loss' | 'breakeven';
  strategy: string; // 'scenario_1' or 'smcfvg'
  participation_level: string; // 'standard', 'aggressive', 'conservative'
  chart_timeframe: string; // '4h', '1h', '15m'
  trade_type: string; // 'completed', 'stopped_out', 'partial_exit'
  notes: string;
  created_at: string;
}

/**
 * Calculate actual Risk:Reward ratio achieved
 */
export function calculateActualRR(
  entry: number,
  exit: number,
  stop: number,
  direction: 'long' | 'short'
): number {
  const riskDistance = Math.abs(entry - stop);

  if (riskDistance === 0) return 0;

  if (direction === 'long') {
    const rewardDistance = Math.abs(exit - entry);
    return rewardDistance / riskDistance;
  } else {
    const rewardDistance = Math.abs(entry - exit);
    return rewardDistance / riskDistance;
  }
}

/**
 * Determine win/loss based on exit price vs stop
 */
export function determineOutcome(
  exit: number,
  stop: number,
  direction: 'long' | 'short',
  tolerance: number = 0.00001
): 'win' | 'loss' | 'breakeven' {
  if (Math.abs(exit - stop) < tolerance) {
    return 'breakeven';
  }

  if (direction === 'long') {
    return exit > stop ? 'win' : 'loss';
  } else {
    return exit < stop ? 'win' : 'loss';
  }
}

/**
 * Calculate P&L in USD
 */
export function calculatePnL(
  entry: number,
  exit: number,
  positionSize: number,
  direction: 'long' | 'short'
): number {
  const pipValue = 10; // Assuming 1 pip = $10 per lot (varies by instrument)

  if (direction === 'long') {
    const pips = (exit - entry) * 10000; // Convert to pips
    return pips * pipValue * positionSize;
  } else {
    const pips = (entry - exit) * 10000; // Convert to pips
    return pips * pipValue * positionSize;
  }
}

/**
 * Format time in Adelaide timezone
 */
export function formatAdelaidTime(date: Date): string {
  return date.toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Adelaide',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Log a completed trade to the database
 */
export async function logTrade(trade: Omit<TradeLog, 'actual_rr_achieved' | 'win_loss' | 'pnl' | 'created_at'>): Promise<void> {
  try {
    // Calculate derived fields
    const actualRR = calculateActualRR(trade.entry_price, trade.exit_price, trade.stop_price, trade.direction);
    const outcome = determineOutcome(trade.exit_price, trade.stop_price, trade.direction);
    const pnl = calculatePnL(trade.entry_price, trade.exit_price, trade.position_size, trade.direction);

    // Insert into database
    dbOps.insertTrade({
      id: trade.id,
      symbol: trade.symbol,
      direction: trade.direction,
      entry_price: trade.entry_price,
      stop_price: trade.stop_price,
      retap_level: undefined,
      size: trade.position_size,
      risk_amount: trade.risk_amount,
      deal_reference: undefined,
      status: 'completed',
      created_at: new Date().toISOString(),
      executed_at: new Date().toISOString(),
      exited_at: new Date().toISOString(),
      exit_price: trade.exit_price,
      pnl: Math.round(pnl),
      message: `${trade.strategy} | ${trade.participation_level} | RR: ${actualRR.toFixed(2)}:1 | ${outcome.toUpperCase()}`,
      error_message: undefined,
    });

    // Log to backtesting table
    dbOps.logBacktestResult({
      symbol: trade.symbol,
      strategy: trade.strategy,
      rr_target: trade.rr_target,
      actual_rr: actualRR,
      win: outcome === 'win' ? 1 : 0,
      entry_price: trade.entry_price,
      exit_price: trade.exit_price,
      pnl: Math.round(pnl),
      participation_level: trade.participation_level,
      chart_timeframe: trade.chart_timeframe,
    });

    console.log(`✅ Trade logged: ${trade.symbol} ${trade.direction.toUpperCase()} | RR: ${actualRR.toFixed(2)}:1 | ${outcome} | P&L: $${Math.round(pnl)}`);
  } catch (error) {
    console.error('Failed to log trade:', error);
    throw error;
  }
}

/**
 * Get trade statistics for a given period
 */
export function getTradeStats(
  symbol?: string,
  strategy?: string,
  since?: Date,
  until?: Date
): {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgRR: number;
  totalPnL: number;
  sharpeRatio?: number;
} {
  try {
    // Query database
    const trades = dbOps.getTradeHistory({
      symbol,
      strategy,
      since,
      until,
    });

    if (trades.length === 0) {
      return {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgRR: 0,
        totalPnL: 0,
      };
    }

    const wins = trades.filter(t => t.pnl > 0).length;
    const losses = trades.filter(t => t.pnl < 0).length;
    const winRate = (wins / trades.length) * 100;
    const avgRR = trades.reduce((sum, t) => sum + (t.rr_ratio || 1), 0) / trades.length;
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    return {
      totalTrades: trades.length,
      wins,
      losses,
      winRate,
      avgRR,
      totalPnL,
    };
  } catch (error) {
    console.error('Failed to get trade stats:', error);
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgRR: 0,
      totalPnL: 0,
    };
  }
}

/**
 * Export trades to CSV format
 */
export function exportTradesCSV(
  trades: any[],
  includeHeader: boolean = true
): string {
  let csv = '';

  if (includeHeader) {
    csv += 'Date,Symbol,Direction,EntryPrice,ExitPrice,StopPrice,RRTarget,ActualRR,Result,PnL,RiskAmount,Strategy\n';
  }

  trades.forEach(trade => {
    const row = [
      new Date(trade.created_at).toLocaleDateString('en-AU'),
      trade.symbol,
      trade.direction.toUpperCase(),
      trade.entry_price.toFixed(5),
      trade.exit_price?.toFixed(5) || 'N/A',
      trade.stop_price.toFixed(5),
      trade.rr_ratio?.toFixed(2) || 'N/A',
      ((trade.exit_price - trade.entry_price) / (trade.entry_price - trade.stop_price)).toFixed(2),
      trade.pnl > 0 ? 'WIN' : trade.pnl < 0 ? 'LOSS' : 'BREAK',
      trade.pnl?.toFixed(2) || '0.00',
      trade.risk_amount?.toString() || '400',
      trade.strategy || 'unknown',
    ];
    csv += row.join(',') + '\n';
  });

  return csv;
}
