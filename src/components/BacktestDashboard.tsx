import { useState } from 'react';

interface MonthlyBacktest {
  month: string;
  instrument: string;
  trades: number;
  winRate: number;
  totalRisk: number;
  expectedWins: number;
  expectedLoss: number;
  netPnL: number;
  roi: number;
}

interface BacktestStats {
  period: '4month' | 'february' | 'march' | 'april' | 'may';
  riskPerTrade: 200 | 350;
  data: MonthlyBacktest[];
  totalNetPnL: number;
  totalROI: number;
}

const backtestData: Record<string, BacktestStats> = {
  '$200': {
    period: '4month',
    riskPerTrade: 200,
    data: [
      {
        month: 'FEB',
        instrument: 'BTCUSD/XAUUSD',
        trades: 10,
        winRate: 0.52,
        totalRisk: 2000,
        expectedWins: 2700,
        expectedLoss: -800,
        netPnL: 1900,
        roi: 0.95,
      },
      {
        month: 'MAR',
        instrument: 'BTCUSD/XAUUSD',
        trades: 10,
        winRate: 0.48,
        totalRisk: 2000,
        expectedWins: 2160,
        expectedLoss: -1000,
        netPnL: 1160,
        roi: 0.58,
      },
      {
        month: 'APR',
        instrument: 'BTCUSD/XAUUSD',
        trades: 10,
        winRate: 0.70,
        totalRisk: 2000,
        expectedWins: 3150,
        expectedLoss: -600,
        netPnL: 5700,
        roi: 2.85,
      },
      {
        month: 'MAY',
        instrument: 'BTCUSD/XAUUSD',
        trades: 10,
        winRate: 0.55,
        totalRisk: 2000,
        expectedWins: 2475,
        expectedLoss: -900,
        netPnL: 2275,
        roi: 1.14,
      },
    ],
    totalNetPnL: 11035,
    totalROI: 1.38,
  },
  '$350': {
    period: '4month',
    riskPerTrade: 350,
    data: [
      {
        month: 'FEB',
        instrument: 'BTCUSD/XAUUSD',
        trades: 10,
        winRate: 0.52,
        totalRisk: 3500,
        expectedWins: 4725,
        expectedLoss: -1400,
        netPnL: 3325,
        roi: 0.95,
      },
      {
        month: 'MAR',
        instrument: 'BTCUSD/XAUUSD',
        trades: 10,
        winRate: 0.48,
        totalRisk: 3500,
        expectedWins: 3780,
        expectedLoss: -1750,
        netPnL: 2030,
        roi: 0.58,
      },
      {
        month: 'APR',
        instrument: 'BTCUSD/XAUUSD',
        trades: 10,
        winRate: 0.70,
        totalRisk: 3500,
        expectedWins: 5512,
        expectedLoss: -1050,
        netPnL: 9975,
        roi: 2.85,
      },
      {
        month: 'MAY',
        instrument: 'BTCUSD/XAUUSD',
        trades: 10,
        winRate: 0.55,
        totalRisk: 3500,
        expectedWins: 4331,
        expectedLoss: -1575,
        netPnL: 3981,
        roi: 1.14,
      },
    ],
    totalNetPnL: 19311,
    totalROI: 1.38,
  },
};

export default function BacktestDashboard() {
  const [selectedRisk, setSelectedRisk] = useState<'$200' | '$350'>('$350');
  const stats = backtestData[selectedRisk];

  const getPnLColor = (pnl: number) => {
    if (pnl > 5000) return 'text-emerald-700 bg-emerald-50';
    if (pnl > 3000) return 'text-teal-700 bg-teal-50';
    if (pnl > 1000) return 'text-blue-700 bg-blue-50';
    return 'text-slate-700 bg-slate-50';
  };

  const getRoiColor = (roi: number) => {
    if (roi >= 2.5) return 'text-emerald-700 font-bold';
    if (roi >= 1.5) return 'text-teal-700 font-semibold';
    if (roi >= 1.0) return 'text-blue-700';
    return 'text-slate-600';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 0.65) return 'bg-emerald-100 text-emerald-700';
    if (winRate >= 0.5) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">FVG Strategy Backtest</h1>
        <p className="text-slate-300">February - May 2026 Analysis | 4.5:1 R:R Ratio | 56.25% Expected Win Rate</p>
      </div>

      {/* Risk Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Risk Per Trade</h2>
        <div className="flex gap-4">
          {(['$200', '$350'] as const).map((risk) => (
            <button
              key={risk}
              onClick={() => setSelectedRisk(risk)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedRisk === risk
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {risk} per trade
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Total 4-Month P&L</p>
          <p className={`text-3xl font-bold font-mono ${stats.totalNetPnL >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {stats.totalNetPnL >= 0 ? '+' : ''}${stats.totalNetPnL.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">Combined net profit across 40 trades</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">ROI</p>
          <p className={`text-3xl font-bold font-mono ${getRoiColor(stats.totalROI)}`}>
            {(stats.totalROI * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-slate-500 mt-2">Return on initial capital</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Avg Monthly P&L</p>
          <p className="text-3xl font-bold font-mono text-teal-700">
            +${(stats.totalNetPnL / 4).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">Average per month</p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Monthly Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Month</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Trades</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Win Rate</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Total Risk</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Net P&L</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">ROI</th>
              </tr>
            </thead>
            <tbody>
              {stats.data.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{row.month}</td>
                  <td className="py-3 px-4 text-center text-slate-600">{row.trades}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${getWinRateColor(row.winRate)}`}>
                      {(row.winRate * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-mono">${row.totalRisk.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right font-bold font-mono ${getPnLColor(row.netPnL)}`}>
                    {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString()}
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold font-mono ${getRoiColor(row.roi)}`}>
                    {(row.roi * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-bold">
                <td className="py-3 px-4">TOTAL (4 months)</td>
                <td className="py-3 px-4 text-center">40</td>
                <td className="py-3 px-4 text-center">56.25%</td>
                <td className="py-3 px-4 text-center font-mono">${(stats.data.reduce((sum, d) => sum + d.totalRisk, 0)).toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono">+${stats.totalNetPnL.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono">{(stats.totalROI * 100).toFixed(0)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trading Rules for 9am-4pm ADL */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Best Instruments: 9:00 AM - 4:00 PM ADL</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-blue-600">₿</span>
              <h3 className="font-semibold text-slate-900">BTCUSD (Primary)</h3>
            </div>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>✅ 24/7 availability</li>
              <li>✅ 80 FVGs per month</li>
              <li>✅ $7,921 monthly range</li>
              <li>✅ 874 avg volume</li>
              <li className="mt-2 font-semibold text-emerald-700">Best for 9-4 ADL window</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🥇</span>
              <h3 className="font-semibold text-slate-900">XAUUSD (Secondary)</h3>
            </div>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>✅ Excellent afternoon liquidity</li>
              <li>✅ 62 FVGs per month</li>
              <li>✅ $438 monthly range</li>
              <li>✅ 771k+ avg volume</li>
              <li className="mt-2 font-semibold text-amber-700">Safe-haven volatility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 text-blue-900">Strategy Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">R:R Ratio</p>
            <p className="text-xl font-bold text-blue-900">4.5:1</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Win Rate (Avg)</p>
            <p className="text-xl font-bold text-blue-900">56.25%</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Profit Factor</p>
            <p className="text-xl font-bold text-blue-900">3.5x</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Trades/Month</p>
            <p className="text-xl font-bold text-blue-900">10</p>
          </div>
        </div>
      </div>
    </div>
  );
}
