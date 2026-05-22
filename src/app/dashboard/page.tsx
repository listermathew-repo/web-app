'use client';

import { useState, useEffect } from 'react';

interface PendingTrade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryLevel: number;
  stopLevel: number;
  createdAt: string;
  expiresAt: string;
}

interface OpenPosition {
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  stopPrice: number;
  profitLoss: number;
  profitLossPercent: number;
  size: number;
}

interface Alert {
  id: string;
  symbol: string;
  level: 'triggered' | 'warning' | 'ok';
  message: string;
  timestamp: string;
  priority: number;
}

interface DailyStats {
  totalTrades: number;
  winnersCount: number;
  losersCount: number;
  totalPnL: number;
  winRate: number;
}

export default function DashboardPage() {
  const [pendingTrades, setPendingTrades] = useState<PendingTrade[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalTrades: 0,
    winnersCount: 0,
    losersCount: 0,
    totalPnL: 0,
    winRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [pendingRes, positionsRes, alertsRes] = await Promise.all([
          fetch('/api/pending'),
          fetch('/api/positions'),
          fetch('/api/alerts/history?limit=10'),
        ]);

        if (pendingRes.ok) setPendingTrades(await pendingRes.json());
        if (positionsRes.ok) setOpenPositions(await positionsRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());

        // Calculate daily stats from positions and history
        const totalTrades = openPositions.length;
        const totalPnL = openPositions.reduce((sum, pos) => sum + pos.profitLoss, 0);
        const winnersCount = openPositions.filter((pos) => pos.profitLoss > 0).length;
        const losersCount = openPositions.filter((pos) => pos.profitLoss < 0).length;

        setDailyStats({
          totalTrades,
          winnersCount,
          losersCount,
          totalPnL,
          winRate: totalTrades > 0 ? (winnersCount / totalTrades) * 100 : 0,
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleApproveClick = async (tradeId: string) => {
    try {
      const response = await fetch(`/api/pending/${tradeId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        setPendingTrades(pendingTrades.filter((t) => t.id !== tradeId));
      }
    } catch (error) {
      console.error('Failed to approve trade:', error);
    }
  };

  const handleRejectClick = async (tradeId: string) => {
    try {
      const response = await fetch(`/api/pending/${tradeId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        setPendingTrades(pendingTrades.filter((t) => t.id !== tradeId));
      }
    } catch (error) {
      console.error('Failed to reject trade:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-2xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">📊 Trading Dashboard</h1>

      {/* DAILY STATS CARD */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-lg">
          <div className="text-gray-300 text-sm">Total Trades</div>
          <div className="text-4xl font-bold">{dailyStats.totalTrades}</div>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-lg">
          <div className="text-gray-300 text-sm">Winners</div>
          <div className="text-4xl font-bold">{dailyStats.winnersCount}</div>
        </div>
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-lg">
          <div className="text-gray-300 text-sm">Losers</div>
          <div className="text-4xl font-bold">{dailyStats.losersCount}</div>
        </div>
        <div className={`bg-gradient-to-br ${dailyStats.totalPnL >= 0 ? 'from-green-600 to-green-800' : 'from-red-600 to-red-800'} p-6 rounded-lg`}>
          <div className="text-gray-300 text-sm">Daily P&L</div>
          <div className="text-4xl font-bold">
            {dailyStats.totalPnL >= 0 ? '+' : ''} ${dailyStats.totalPnL.toFixed(2)}
          </div>
          <div className="text-sm mt-2">{dailyStats.winRate.toFixed(1)}% win rate</div>
        </div>
      </div>

      {/* PENDING TRADES SECTION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🟡 Pending Trades ({pendingTrades.length})</h2>
        {pendingTrades.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded-lg text-gray-400">No pending trades waiting for approval</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingTrades.map((trade) => {
              const timeRemaining = Math.max(
                0,
                Math.round((new Date(trade.expiresAt).getTime() - Date.now()) / 1000)
              );
              const risk = Math.abs(trade.entryLevel - trade.stopLevel);
              const rrr = risk > 0 ? 400 / risk : 0;

              return (
                <div key={trade.id} className="bg-gray-800 border border-yellow-600 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{trade.symbol}</h3>
                      <div className="text-sm text-gray-400">ID: {trade.id.slice(0, 8)}</div>
                    </div>
                    <div className={`px-3 py-1 rounded font-bold text-white ${
                      trade.direction === 'long' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {trade.direction.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-gray-400">Entry</div>
                      <div className="font-bold text-lg">{trade.entryLevel.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Stop</div>
                      <div className="font-bold text-lg">{trade.stopLevel.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Risk</div>
                      <div className="font-bold">400 USD</div>
                    </div>
                    <div>
                      <div className="text-gray-400">RRR</div>
                      <div className="font-bold">{rrr.toFixed(2)}:1</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-400">Expires in: {timeRemaining}s</div>
                    <div className="w-full bg-gray-700 rounded h-2 mt-2">
                      <div
                        className="bg-yellow-600 h-2 rounded transition-all"
                        style={{ width: `${Math.max(0, (timeRemaining / 300) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveClick(trade.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold transition"
                    >
                      ✅ APPROVE
                    </button>
                    <button
                      onClick={() => handleRejectClick(trade.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition"
                    >
                      ❌ REJECT
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OPEN POSITIONS SECTION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">📈 Open Positions ({openPositions.length})</h2>
        {openPositions.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded-lg text-gray-400">No open positions</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {openPositions.map((pos) => (
              <div
                key={pos.symbol}
                className={`border p-6 rounded-lg ${
                  pos.profitLoss >= 0
                    ? 'bg-green-900 border-green-600'
                    : 'bg-red-900 border-red-600'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{pos.symbol}</h3>
                  <div className={`px-3 py-1 rounded font-bold text-white ${
                    pos.direction === 'long' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {pos.direction.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Entry</span>
                    <span className="font-bold">{pos.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Current</span>
                    <span className="font-bold">{pos.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Stop</span>
                    <span className="font-bold">{pos.stopPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Size</span>
                    <span className="font-bold">{pos.size.toFixed(2)} lots</span>
                  </div>
                </div>

                <div className={`text-2xl font-bold text-center p-4 rounded ${
                  pos.profitLoss >= 0 ? 'bg-green-800' : 'bg-red-800'
                }`}>
                  {pos.profitLoss >= 0 ? '+' : ''} ${pos.profitLoss.toFixed(2)}
                  <div className="text-sm mt-1">({pos.profitLossPercent.toFixed(2)}%)</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ALERT HISTORY SECTION */}
      <div>
        <h2 className="text-2xl font-bold mb-4">🔔 Recent Alerts (Last 10)</h2>
        {alerts.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded-lg text-gray-400">No recent alerts</div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900">
                  <th className="px-6 py-4 text-left">Time</th>
                  <th className="px-6 py-4 text-left">Symbol</th>
                  <th className="px-6 py-4 text-left">Level</th>
                  <th className="px-6 py-4 text-left">Message</th>
                  <th className="px-6 py-4 text-left">Priority</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-sm">
                      {new Date(alert.timestamp).toLocaleTimeString('en-AU', {
                        timeZone: 'Australia/Adelaide',
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold">{alert.symbol}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-block px-2 py-1 rounded text-white font-bold ${
                        alert.level === 'triggered' ? 'bg-red-600' :
                        alert.level === 'warning' ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}>
                        {alert.level === 'triggered' ? '🔴 TRIGGERED' :
                         alert.level === 'warning' ? '🟡 WARNING' :
                         '🟢 OK'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{alert.message}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-block bg-purple-600 px-2 py-1 rounded text-white font-bold">
                        {alert.priority}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
