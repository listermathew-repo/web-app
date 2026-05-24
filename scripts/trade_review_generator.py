#!/usr/bin/env python3
"""
Trade Review Generator
Parses TradingView CSV exports and generates interactive Plotly candlestick review charts
with entry/exit markers, stop loss/take profit zones, and trade metrics.

Usage:
    python scripts/trade_review_generator.py --csv exports/trades.csv --output charts/
    python scripts/trade_review_generator.py --csv trades.csv --output charts/ --symbol EURUSD
"""

import argparse
import csv
import json
import os
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import plotly.graph_objects as go


class CapitalComAPI:
    """Fetches historical OHLCV data from Capital.com API"""

    def __init__(self, api_key: str = os.getenv("CAPITAL_API_KEY", "demo")):
        self.api_key = api_key
        self.base_url = "https://api.capital.com"
        # In production, use actual Capital.com API
        # For now, generate mock OHLCV data

    def get_ohlcv(
        self,
        symbol: str,
        timeframe: str,
        start_time: int,
        end_time: int,
    ) -> List[Dict[str, Any]]:
        """
        Fetch OHLCV bars for a symbol in a time range.
        Args:
            symbol: e.g., 'EURUSD'
            timeframe: '1H', '4H', '1D', etc.
            start_time: Unix timestamp (seconds)
            end_time: Unix timestamp (seconds)

        Returns:
            List of {time, open, high, low, close, volume}
        """
        # Mock implementation - replace with actual API call
        # In production: requests.get(f"{self.base_url}/prices/{symbol}?...")
        bars = self._generate_mock_bars(start_time, end_time)
        return bars

    def _generate_mock_bars(self, start_time: int, end_time: int) -> List[Dict]:
        """Generate mock OHLCV data for demonstration"""
        bars = []
        current_time = start_time
        current_price = 1.1600  # Example EURUSD price

        # Generate 1-hour bars
        while current_time < end_time:
            open_price = current_price
            close_price = current_price + (
                0.0005 if (current_time % 2 == 0) else -0.0003
            )
            high_price = max(open_price, close_price) + 0.0002
            low_price = min(open_price, close_price) - 0.0002
            volume = 250000 + (current_time % 100000)

            bars.append(
                {
                    "time": current_time,
                    "open": round(open_price, 5),
                    "high": round(high_price, 5),
                    "low": round(low_price, 5),
                    "close": round(close_price, 5),
                    "volume": volume,
                }
            )

            current_time += 3600  # 1 hour
            current_price = close_price

        return bars


class TradeReviewGenerator:
    """Generates Plotly interactive trade review charts"""

    def __init__(self, output_dir: str = "./charts", db_path: Optional[str] = None):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.capital = CapitalComAPI()
        self.db_path = db_path
        self.db_conn: Optional[sqlite3.Connection] = None

    def connect_db(self) -> sqlite3.Connection:
        """Connect to SQLite database"""
        if not self.db_path:
            return None

        self.db_conn = sqlite3.connect(self.db_path)
        self.db_conn.row_factory = sqlite3.Row
        return self.db_conn

    def load_trades_from_csv(self, csv_path: str) -> List[Dict[str, Any]]:
        """Parse TradingView CSV export"""
        trades = []

        with open(csv_path, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    trade = {
                        "symbol": row.get("Symbol", "EURUSD").upper(),
                        "direction": row.get("Direction", "BUY").lower(),
                        "entry_price": float(row.get("Entry", 0)),
                        "stop_price": float(row.get("Stop", 0)),
                        "exit_price": float(row.get("Exit", 0)) if row.get("Exit") else None,
                        "entry_time": self._parse_timestamp(row.get("Date"), row.get("Time")),
                        "exit_time": self._parse_timestamp(
                            row.get("Exit Date"), row.get("Exit Time")
                        )
                        if row.get("Exit Date")
                        else None,
                        "pips": float(row.get("Pips", 0)),
                        "status": row.get("Status", "closed").lower(),
                        "notes": row.get("Notes", ""),
                    }
                    trades.append(trade)
                except (ValueError, KeyError) as e:
                    print(f"⚠️  Skipping row: {e}")
                    continue

        print(f"✅ Loaded {len(trades)} trades from {csv_path}")
        return trades

    def _parse_timestamp(self, date_str: Optional[str], time_str: Optional[str] = None) -> Optional[int]:
        """Parse date/time strings to Unix timestamp"""
        if not date_str:
            return None

        try:
            if time_str:
                dt_str = f"{date_str} {time_str}"
                dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            else:
                dt = datetime.strptime(date_str, "%Y-%m-%d")

            return int(dt.timestamp())
        except ValueError:
            return None

    def generate_review_chart(self, trade: Dict[str, Any]) -> str:
        """Generate interactive Plotly chart for a single trade"""
        # Fetch OHLCV data (±2 hours around entry)
        entry_time = trade["entry_time"]
        start_time = entry_time - (2 * 3600) if entry_time else int(datetime.now().timestamp()) - 7200
        end_time = entry_time + (2 * 3600) if entry_time else int(datetime.now().timestamp())

        ohlcv_data = self.capital.get_ohlcv(
            symbol=trade["symbol"],
            timeframe="1H",
            start_time=start_time,
            end_time=end_time,
        )

        # Create candlestick chart
        fig = go.Figure(
            data=[
                go.Candlestick(
                    x=[datetime.fromtimestamp(bar["time"]).isoformat() for bar in ohlcv_data],
                    open=[bar["open"] for bar in ohlcv_data],
                    high=[bar["high"] for bar in ohlcv_data],
                    low=[bar["low"] for bar in ohlcv_data],
                    close=[bar["close"] for bar in ohlcv_data],
                    name="OHLC",
                )
            ]
        )

        # Add entry marker
        entry_time_str = datetime.fromtimestamp(entry_time).isoformat() if entry_time else ""
        fig.add_trace(
            go.Scatter(
                x=[entry_time_str],
                y=[trade["entry_price"]],
                mode="markers+text",
                marker=dict(
                    size=15,
                    color="green" if trade["direction"] == "long" else "red",
                    symbol="triangle-up" if trade["direction"] == "long" else "triangle-down",
                ),
                text=[f"ENTRY @ {trade['entry_price']:.5f}"],
                textposition="top center",
                name="Entry",
                hovertemplate=f"<b>Entry</b><br>Price: {trade['entry_price']:.5f}<extra></extra>",
            )
        )

        # Add exit marker if available
        if trade["exit_price"] and trade["exit_time"]:
            exit_time_str = datetime.fromtimestamp(trade["exit_time"]).isoformat()
            exit_color = "blue" if trade["pips"] > 0 else "orange"

            fig.add_trace(
                go.Scatter(
                    x=[exit_time_str],
                    y=[trade["exit_price"]],
                    mode="markers+text",
                    marker=dict(size=15, color=exit_color, symbol="diamond"),
                    text=[f"EXIT @ {trade['exit_price']:.5f}"],
                    textposition="bottom center",
                    name="Exit",
                    hovertemplate=f"<b>Exit</b><br>Price: {trade['exit_price']:.5f}<extra></extra>",
                )
            )

        # Add stop loss line
        fig.add_hline(
            y=trade["stop_price"],
            line_dash="dash",
            line_color="red",
            annotation_text=f"SL: {trade['stop_price']:.5f}",
            annotation_position="right",
        )

        # Calculate and display Risk/Reward
        entry = trade["entry_price"]
        stop = trade["stop_price"]
        exit_p = trade["exit_price"] or entry

        risk_pips = abs(entry - stop) * 10000
        reward_pips = abs(exit_p - entry) * 10000
        rr_ratio = reward_pips / risk_pips if risk_pips > 0 else 0

        # Update layout
        fig.update_layout(
            title=dict(
                text=f"Trade Review: {trade['symbol']} {trade['direction'].upper()} @ {entry:.5f}",
                x=0.5,
                xanchor="center",
            ),
            xaxis_title="Time (ADL)",
            yaxis_title=f"Price ({trade['symbol']})",
            hovermode="x unified",
            template="plotly_dark",
            height=600,
            width=1200,
            annotations=[
                dict(
                    text=f"Risk/Reward: {rr_ratio:.2f}:1 | Pips: {trade['pips']:.0f} | Status: {trade['status'].upper()}",
                    xref="paper",
                    yref="paper",
                    x=0.5,
                    y=-0.15,
                    showarrow=False,
                    xanchor="center",
                )
            ],
        )

        # Save as HTML
        filename = self._generate_filename(trade)
        filepath = self.output_dir / filename
        fig.write_html(str(filepath))

        print(f"✅ Generated: {filename}")
        return str(filepath)

    def _generate_filename(self, trade: Dict[str, Any]) -> str:
        """Generate descriptive filename"""
        date_str = (
            datetime.fromtimestamp(trade["entry_time"]).strftime("%Y%m%d")
            if trade["entry_time"]
            else "unknown"
        )
        direction = trade["direction"][:3].upper()
        rr = f"_{trade['pips']:.0f}pip" if trade["pips"] else ""
        return f"{trade['symbol']}_{direction}_{date_str}{rr}.html"

    def insert_chart_metadata(self, trade_id: str, chart_path: str) -> None:
        """Insert chart metadata into SQLite database"""
        if not self.db_conn:
            return

        try:
            cursor = self.db_conn.cursor()
            cursor.execute(
                """
                UPDATE trades
                SET chart_generated_at = ?, chart_html_path = ?
                WHERE id = ?
            """,
                (datetime.now().isoformat(), chart_path, trade_id),
            )
            self.db_conn.commit()
            print(f"📊 Chart metadata saved for trade {trade_id}")
        except sqlite3.Error as e:
            print(f"⚠️  Database error: {e}")

    def process_trades(
        self,
        csv_path: str,
        symbol_filter: Optional[str] = None,
    ) -> None:
        """Process all trades from CSV"""
        trades = self.load_trades_from_csv(csv_path)

        if symbol_filter:
            trades = [t for t in trades if t["symbol"] == symbol_filter.upper()]
            print(f"📌 Filtered to {len(trades)} {symbol_filter} trades")

        for i, trade in enumerate(trades, 1):
            print(f"\n[{i}/{len(trades)}] Processing {trade['symbol']} {trade['direction'].upper()}...")
            self.generate_review_chart(trade)

        print(f"\n✨ Done! Generated {len(trades)} charts in {self.output_dir}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate trade review charts from TradingView CSV exports"
    )
    parser.add_argument("--csv", required=True, help="Path to TradingView CSV export")
    parser.add_argument(
        "--output", default="./charts", help="Output directory for HTML charts (default: ./charts)"
    )
    parser.add_argument("--symbol", help="Filter to specific symbol (e.g., EURUSD)")
    parser.add_argument(
        "--db",
        help="SQLite database path (optional, to save chart metadata)",
    )

    args = parser.parse_args()

    generator = TradeReviewGenerator(output_dir=args.output, db_path=args.db)

    if args.db:
        generator.connect_db()

    try:
        generator.process_trades(csv_path=args.csv, symbol_filter=args.symbol)
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
