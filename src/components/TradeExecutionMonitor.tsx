"use client";

import { useState, useEffect, useCallback } from "react";

interface Position {
  symbol: string;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_percent: number;
  size: number;
  open_time: string;
  stop_loss: number;
}

interface TradeMetrics {
  daily_winners: number;
  daily_losers: number;
  win_rate: number;
  avg_entry_time_minutes: number;
  total_pnl: number;
  expected_daily_target: number;
}

interface ConfluenceScore {
  score: number;
  frequency: number;
}

interface HourlySetup {
  hour: number;
  count: number;
  avg_pnl: number;
}

interface MonitorData {
  status: "ok" | "error";
  timestamp: string;
  positions: Position[];
  metrics: TradeMetrics;
  confluence_distribution: ConfluenceScore[];
  hourly_analysis: HourlySetup[];
}

export default function TradeExecutionMonitor() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitorData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/trades/monitor");

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const monitorData = (await response.json()) as MonitorData;
      setData(monitorData);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      console.error("Failed to fetch monitor data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMonitorData();
  }, [fetchMonitorData]);

  // Auto-refresh every 30 seconds during trading hours
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMonitorData();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMonitorData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-slate-600">Loading trade execution data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <p className="font-semibold text-red-900">Error Loading Trade Data</p>
        <p className="text-sm text-red-700 mt-1">{error || "Unknown error"}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchMonitorData();
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { positions, metrics } = data;
  const targetPnL = metrics.expected_daily_target;
  const targetProgress = Math.min((metrics.total_pnl / targetPnL) * 100, 100);
  const isOnTrack = metrics.total_pnl >= targetPnL * 0.8; // 80% of target = on track

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-700">Auto-refresh (30s)</span>
          </label>
        </div>
        <div className="text-xs text-slate-500">
          Last updated: {lastUpdate?.toLocaleTimeString("en-AU", { timeZoneName: "short" })}
        </div>
      </div>

      {/* Today's Trade Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* P&L Progress */}
        <div className="border border-slate-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase">Today's P&L</p>
          <div className="mt-3">
            <p className="text-3xl font-bold text-emerald-900">
              ${metrics.total_pnl.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-700 mt-2">
              Target: ${targetPnL.toLocaleString()} ADL
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-4 bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isOnTrack ? "bg-green-500" : "bg-orange-500"
              }`}
              style={{ width: `${targetProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {isOnTrack ? "✅ On track" : "⚠️ Below 80% of target"}
          </p>
        </div>

        {/* Win/Loss Record */}
        <div className="border border-slate-200 bg-blue-50 rounded-lg p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase">Win Rate</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">
            {(metrics.win_rate * 100).toFixed(0)}%
          </p>
          <div className="mt-4 flex gap-3">
            <div>
              <p className="text-xs text-blue-600 font-semibold">Winners</p>
              <p className="text-lg font-bold text-green-600">{metrics.daily_winners}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold">Losers</p>
              <p className="text-lg font-bold text-red-600">{metrics.daily_losers}</p>
            </div>
          </div>
        </div>

        {/* Entry Time */}
        <div className="border border-slate-200 bg-purple-50 rounded-lg p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase">Avg Entry Time</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">
            {metrics.avg_entry_time_minutes.toFixed(0)}
            <span className="text-sm ml-1">min</span>
          </p>
          <p className="text-xs text-purple-700 mt-3">
            Stage 1 → Stage 5 (Target: 55-58 min)
          </p>
          {metrics.avg_entry_time_minutes >= 55 && metrics.avg_entry_time_minutes <= 58 ? (
            <p className="text-xs text-green-600 mt-1">✅ Within optimal window</p>
          ) : (
            <p className="text-xs text-orange-600 mt-1">
              {metrics.avg_entry_time_minutes < 55 ? "⚡ Faster than target" : "⏱️ Slower than target"}
            </p>
          )}
        </div>
      </div>

      {/* Open Positions */}
      {positions.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">
              Open Positions ({positions.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-200">
            {positions.map((pos, idx) => (
              <div key={idx} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-900">{pos.symbol}</p>
                    <p className="text-xs text-slate-500">
                      Opened {new Date(pos.open_time).toLocaleTimeString("en-AU")} ADL
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${pos.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${Math.abs(pos.pnl).toLocaleString()}
                    </p>
                    <p className={`text-xs font-semibold ${pos.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {pos.pnl >= 0 ? "+" : ""}{pos.pnl_percent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Price levels */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <p className="text-xs text-slate-600 font-semibold">Entry</p>
                    <p className="font-bold text-slate-900">{pos.entry_price.toFixed(4)}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">Current</p>
                    <p className="font-bold text-blue-900">{pos.current_price.toFixed(4)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-xs text-red-600 font-semibold">Stop Loss</p>
                    <p className="font-bold text-red-900">{pos.stop_loss.toFixed(4)}</p>
                  </div>
                </div>

                {/* Distance to stop loss */}
                <div className="text-xs text-slate-600">
                  Distance to stop: {Math.abs(pos.current_price - pos.stop_loss).toFixed(4)} pips
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {positions.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-lg p-8 text-center">
          <p className="text-slate-500">No open positions</p>
        </div>
      )}

      {/* Confluence Score Distribution */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Confluence Score Distribution</h3>
          <p className="text-xs text-slate-600 mt-1">
            Stage 5 trigger scores that executed today (Target: 85%+)
          </p>
        </div>

        <div className="p-6">
          {data.confluence_distribution.length > 0 ? (
            <div className="space-y-3">
              {data.confluence_distribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-12 text-right text-sm font-semibold text-slate-900">
                    {item.score}%
                  </div>
                  <div className="flex-1 bg-slate-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        item.score >= 85
                          ? "bg-green-500"
                          : item.score >= 80
                            ? "bg-blue-500"
                            : "bg-orange-500"
                      }`}
                      style={{ width: `${Math.min(item.frequency * 10, 100)}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-sm font-semibold text-slate-900">
                    {item.frequency}x
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No confluence data yet</p>
          )}
        </div>
      </div>

      {/* Hourly Setup Analysis */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Setups by Hour (ADL)</h3>
          <p className="text-xs text-slate-600 mt-1">Peak window: 12:30-17:30 ADL (AUDUSD primary)</p>
        </div>

        <div className="p-6">
          {data.hourly_analysis.length > 0 ? (
            <div className="space-y-2">
              {data.hourly_analysis.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-semibold text-slate-900">
                    {String(hour.hour).padStart(2, "0")}:00
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-200 rounded-full h-8 overflow-hidden flex-1">
                        <div
                          className={`h-full transition-all ${
                            hour.count >= 2 ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(hour.count * 25, 100)}%` }}
                        ></div>
                      </div>
                      <div className="w-24 text-right">
                        <p className="text-sm font-bold text-slate-900">{hour.count} setups</p>
                        <p className="text-xs text-slate-600">
                          Avg: ${hour.avg_pnl > 0 ? "+" : ""}
                          {hour.avg_pnl.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No hourly data yet</p>
          )}
        </div>
      </div>

      {/* Expected vs Actual */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-amber-900 mb-4">Performance vs Target</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase">Expected (62% Win Rate)</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">${targetPnL.toLocaleString()}</p>
            <p className="text-sm text-amber-700 mt-2">
              2-3 setups × 62% win rate × $1,680 avg profit
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase">Actual (Today)</p>
            <p className={`text-2xl font-bold mt-1 ${metrics.total_pnl >= 0 ? "text-green-900" : "text-red-900"}`}>
              ${metrics.total_pnl.toLocaleString()}
            </p>
            <p className="text-sm text-amber-700 mt-2">
              {metrics.daily_winners + metrics.daily_losers} executions
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-amber-200 text-xs text-amber-700">
          <p>
            ✅ Win Rate: {(metrics.win_rate * 100).toFixed(0)}% (Target: 60%+)
          </p>
          <p className="mt-1">
            ✅ Avg Entry Time: {metrics.avg_entry_time_minutes.toFixed(0)} min (Target: 55-58 min)
          </p>
          <p className="mt-1">
            {metrics.total_pnl >= targetPnL ? "✅" : "⏱️"} Daily Target: {metrics.total_pnl >= targetPnL ? "EXCEEDED" : "In Progress"}
          </p>
        </div>
      </div>
    </div>
  );
}
