"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

interface PendingTrade {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entry_level: number;
  stop_level: number;
  risk_amount: number;
  created_at: string;
  expires_at: string;
}

export default function PendingTradesWidget() {
  const [trades, setTrades] = useState<PendingTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPendingTrades();
    const interval = setInterval(fetchPendingTrades, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const updated = { ...prev };
        trades.forEach((trade) => {
          const expiresAt = new Date(trade.expires_at).getTime();
          const now = new Date().getTime();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          updated[trade.id] = remaining;
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [trades]);

  const fetchPendingTrades = async () => {
    try {
      const response = await fetch("/api/pending", {
        headers: { "X-API-Key": process.env.NEXT_PUBLIC_WEBHOOK_API_KEY || "" },
      });
      const data = await response.json();
      setTrades(data.trades || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch pending trades:", error);
      setLoading(false);
    }
  };

  const handleApprove = async (tradeId: string) => {
    setApproving(tradeId);
    try {
      const response = await fetch(`/api/pending/${tradeId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_WEBHOOK_API_KEY || "",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setTrades(trades.filter((t) => t.id !== tradeId));
        alert("✅ Trade approved and executed!");
      } else {
        const error = await response.json();
        alert(`❌ Approval failed: ${error.reason || error.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (tradeId: string) => {
    setRejecting(tradeId);
    try {
      const response = await fetch(`/api/pending/${tradeId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_WEBHOOK_API_KEY || "",
        },
      });

      if (response.ok) {
        setTrades(trades.filter((t) => t.id !== tradeId));
        alert("❌ Trade rejected");
      }
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setRejecting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
          ⏳ Pending Trade Approvals
        </h2>
        <div className="text-center text-slate-400 py-4">Loading...</div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
          ⏳ Pending Trade Approvals
        </h2>
        <div className="text-center text-slate-400 py-4">No pending trades</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm bg-amber-50">
      <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <AlertCircle size={16} /> Pending Trade Approvals ({trades.length})
      </h2>

      <div className="space-y-3">
        {trades.map((trade) => {
          const secondsRemaining = timeRemaining[trade.id] || 300;
          const minutesRemaining = Math.floor(secondsRemaining / 60);
          const isExpiring = secondsRemaining < 60;

          return (
            <div
              key={trade.id}
              className={`border rounded-lg p-4 ${
                isExpiring
                  ? "border-red-300 bg-red-50"
                  : "border-amber-200 bg-white"
              }`}
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Symbol</p>
                  <p className="text-sm font-bold text-slate-900">{trade.symbol}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Direction</p>
                  <p className={`text-sm font-bold ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                    {trade.direction.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Entry</p>
                  <p className="text-sm font-bold text-slate-900">{trade.entry_level.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Stop</p>
                  <p className="text-sm font-bold text-slate-900">{trade.stop_level.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Risk</p>
                  <p className="text-sm font-bold text-slate-900">${trade.risk_amount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1 text-[11px] font-semibold">
                  <Clock size={12} className={isExpiring ? "text-red-600" : "text-slate-600"} />
                  <span className={isExpiring ? "text-red-600" : "text-slate-600"}>
                    {minutesRemaining}:{String(secondsRemaining % 60).padStart(2, "0")} remaining
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(trade.id)}
                    disabled={approving === trade.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <CheckCircle size={14} /> {approving === trade.id ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(trade.id)}
                    disabled={rejecting === trade.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <XCircle size={14} /> {rejecting === trade.id ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
