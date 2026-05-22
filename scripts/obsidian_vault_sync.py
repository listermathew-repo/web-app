#!/usr/bin/env python3
"""
Obsidian Vault Sync for Trading Post-Mortems
Auto-generates markdown trade review notes with embedded charts in Obsidian vault.
Pulls from SQLite trading database and creates structured post-mortem analysis.

Usage:
    python scripts/obsidian_vault_sync.py --vault ~/ObsidianVault/Trading --db .db/trading.db
    python scripts/obsidian_vault_sync.py --vault ~/ObsidianVault/Trading --status closed
"""

import argparse
import os
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import json


class ObsidianVaultSync:
    """Manages trade post-mortem notes in Obsidian vault"""

    def __init__(self, vault_path: str, db_path: str):
        self.vault_path = Path(vault_path)
        self.db_path = db_path
        self.db_conn: Optional[sqlite3.Connection] = None

        # Create vault structure if needed
        self._ensure_vault_structure()

    def _ensure_vault_structure(self) -> None:
        """Create required directories in vault"""
        directories = [
            self.vault_path / "Trades",
            self.vault_path / "Trades" / "Templates",
            self.vault_path / "Trades" / "Index",
        ]

        for dir_path in directories:
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Vault dir: {dir_path}")

    def connect_db(self) -> sqlite3.Connection:
        """Connect to SQLite database"""
        self.db_conn = sqlite3.connect(self.db_path)
        self.db_conn.row_factory = sqlite3.Row
        print(f"✅ Connected to database: {self.db_path}")
        return self.db_conn

    def query_trades(
        self, status: str = "exited", limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Query closed/exited trades from database"""
        if not self.db_conn:
            self.connect_db()

        cursor = self.db_conn.cursor()
        cursor.execute(
            """
            SELECT t.*, v.ema10, v.ema21, v.vwap, v.volume, v.volume_avg, v.atr
            FROM trades t
            LEFT JOIN validation_log v ON t.id = v.trade_id
            WHERE t.status = ? OR (? = 'all')
            ORDER BY t.created_at DESC
            LIMIT ?
        """,
            (status if status != "all" else "placeholder", status, limit),
        )

        trades = []
        for row in cursor.fetchall():
            trade_dict = dict(row)
            trade_dict["created_at"] = datetime.fromisoformat(
                trade_dict["created_at"]
            ).strftime("%Y-%m-%d %H:%M ADL")
            if trade_dict.get("executed_at"):
                trade_dict["executed_at"] = datetime.fromisoformat(
                    trade_dict["executed_at"]
                ).strftime("%H:%M ADL")
            if trade_dict.get("exited_at"):
                trade_dict["exited_at"] = datetime.fromisoformat(
                    trade_dict["exited_at"]
                ).strftime("%H:%M ADL")

            trades.append(trade_dict)

        print(f"✅ Loaded {len(trades)} {status} trades")
        return trades

    def generate_postmortem_markdown(self, trade: Dict[str, Any]) -> str:
        """Generate markdown post-mortem note for a trade"""
        symbol = trade["symbol"]
        direction = trade["direction"].upper()
        entry = float(trade["entry_price"])
        stop = float(trade["stop_price"])
        exit_p = float(trade["exit_price"]) if trade.get("exit_price") else None
        pnl = trade.get("pnl", 0)
        created_at = trade.get("created_at", "Unknown")

        # Calculate Risk/Reward
        risk_pips = abs(entry - stop) * 10000
        reward_pips = abs(exit_p - entry) * 10000 if exit_p else 0
        rr_ratio = reward_pips / risk_pips if risk_pips > 0 else 0

        # Validation Check #9 data
        ema10 = trade.get("ema10")
        ema21 = trade.get("ema21")
        vwap = trade.get("vwap")
        volume = trade.get("volume")
        volume_avg = trade.get("volume_avg")
        atr = trade.get("atr")

        # Build markdown
        markdown = f"""# Trade Review: {symbol} {direction}

**Status**: {'✅ Won' if pnl > 0 else '❌ Lost' if pnl < 0 else '➖ Breakeven'}
**Date**: {created_at}
**Pair**: {symbol}
**Direction**: {direction}

## Entry Details
- **Entry Price**: {entry:.5f}
- **Entry Time**: {trade.get('created_at', 'N/A')}
- **Stop Loss**: {stop:.5f}
- **Exit Price**: {exit_p:.5f if exit_p else 'N/A'}
- **Exit Time**: {trade.get('exited_at', 'N/A')}

## Trade Metrics
- **Risk Distance**: {risk_pips:.0f} pips
- **Reward Distance**: {reward_pips:.0f} pips
- **Risk/Reward Ratio**: {rr_ratio:.2f}:1
- **P&L**: {'🤑' if pnl > 0 else '💔' if pnl < 0 else '➖'} ${pnl} USD
- **Status**: {trade.get('status', 'Unknown').upper()}

## Validation Check #9 (Chart Confirmation)
"""

        if ema10 and ema21:
            ema_aligned = ema10 > ema21 if direction == "LONG" else ema10 < ema21
            markdown += f"\n- {'✅' if ema_aligned else '❌'} **EMA Alignment**: EMA10 {ema10:.5f} vs EMA21 {ema21:.5f}"

        if vwap and entry:
            vwap_confirmed = entry > vwap if direction == "LONG" else entry < vwap
            markdown += f"\n- {'✅' if vwap_confirmed else '❌'} **VWAP Confirmation**: Entry {entry:.5f} vs VWAP {vwap:.5f}"

        if volume and volume_avg:
            volume_ratio = volume / volume_avg
            volume_confirmed = volume_ratio >= 1.5
            markdown += f"\n- {'✅' if volume_confirmed else '❌'} **Volume Surge**: {volume_ratio:.2f}x average (min 1.5x)"

        if atr:
            atr_valid = 10 <= atr <= 50
            markdown += f"\n- {'✅' if atr_valid else '❌'} **ATR**: {atr:.0f} pips (valid range: 10-50)"

        markdown += f"""

## Trade Analysis
### What Worked
- Entry was properly validated against all checks
- Risk management rules were followed
- Position sizing matched the trading plan

### What Could Improve
- Consider the market context at entry
- Review if exit timing was optimal
- Analyze if additional confirmations would help

### Lessons Learned
- Document key insights from this trade
- Note patterns or conditions that led to success/failure
- Plan improvements for similar setups in future

## Attached Chart
<!-- Chart would be embedded here -->
![[{self._generate_chart_filename(trade)}]]

---
**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ADL
**Trade ID**: `{trade['id']}`
**Tags**: #trade-review #{symbol.lower()} #{direction.lower()} #{'closed' if pnl != 0 else 'open'}
"""

        return markdown

    def _generate_chart_filename(self, trade: Dict[str, Any]) -> str:
        """Generate chart filename reference"""
        symbol = trade["symbol"]
        direction = trade["direction"][:3].upper()
        date = trade["created_at"].split(" ")[0]  # YYYY-MM-DD
        return f"{symbol}_{direction}_{date}_chart.html"

    def save_note_to_vault(self, trade: Dict[str, Any], markdown: str) -> Path:
        """Save markdown note to vault"""
        symbol = trade["symbol"]
        date_str = trade["created_at"].split(" ")[0]  # YYYY-MM-DD
        direction = trade["direction"][:3].upper()

        # Create year/month subdirectory
        year_month = date_str[:7]  # YYYY-MM
        trade_dir = self.vault_path / "Trades" / year_month
        trade_dir.mkdir(parents=True, exist_ok=True)

        # Filename: EURUSD_BUY_2026-05-21.md
        filename = f"{symbol}_{direction}_{date_str}.md"
        filepath = trade_dir / filename

        # Avoid overwriting (append number if exists)
        if filepath.exists():
            base_name = filepath.stem
            ext = filepath.suffix
            counter = 1
            while (trade_dir / f"{base_name}_{counter}{ext}").exists():
                counter += 1
            filepath = trade_dir / f"{base_name}_{counter}{ext}"

        # Write markdown
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(markdown)

        print(f"✅ Saved: {filepath}")
        return filepath

    def sync_charts(
        self, chart_dir: Optional[str] = None
    ) -> None:
        """Copy generated charts to vault"""
        if not chart_dir:
            chart_dir = "./charts"

        chart_path = Path(chart_dir)
        if not chart_path.exists():
            print(f"⚠️  Chart directory not found: {chart_dir}")
            return

        vault_charts = self.vault_path / "Trades" / "Charts"
        vault_charts.mkdir(parents=True, exist_ok=True)

        chart_files = list(chart_path.glob("*.html"))
        print(f"📊 Syncing {len(chart_files)} charts...")

        for chart_file in chart_files:
            dest = vault_charts / chart_file.name
            if not dest.exists():
                shutil.copy2(chart_file, dest)
                print(f"  ✅ {chart_file.name}")
            else:
                print(f"  ⏭️  {chart_file.name} (already exists)")

    def create_trades_index(self, trades: List[Dict[str, Any]]) -> None:
        """Create index document listing all trades"""
        index_file = self.vault_path / "Trades" / "Index" / "All Trades.md"

        index_content = "# Trade Journal Index\n\n"
        index_content += f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ADL\n\n"

        # Group by symbol
        by_symbol: Dict[str, List] = {}
        for trade in trades:
            symbol = trade["symbol"]
            if symbol not in by_symbol:
                by_symbol[symbol] = []
            by_symbol[symbol].append(trade)

        # Create index
        for symbol in sorted(by_symbol.keys()):
            index_content += f"\n## {symbol}\n\n"
            for trade in sorted(by_symbol[symbol], key=lambda t: t["created_at"], reverse=True):
                date = trade["created_at"].split(" ")[0]
                direction = trade["direction"].upper()
                pnl = trade.get("pnl", 0)
                pnl_icon = "🤑" if pnl > 0 else "💔" if pnl < 0 else "➖"

                index_content += f"- {pnl_icon} [{symbol} {direction} - {date}]"
                index_content += f"(../Trades/{date[:7]}/{symbol}_{direction[:3]}_{date}.md)\n"

        # Save
        with open(index_file, "w", encoding="utf-8") as f:
            f.write(index_content)

        print(f"✅ Index created: {index_file}")

    def sync_all(
        self,
        status: str = "exited",
        chart_dir: Optional[str] = None,
    ) -> None:
        """Full sync: query trades, generate notes, sync charts"""
        print(f"\n📋 Starting Obsidian vault sync...")
        print(f"   Vault: {self.vault_path}")
        print(f"   Status filter: {status}")

        # Query trades
        trades = self.query_trades(status=status)

        if not trades:
            print("⚠️  No trades found")
            return

        # Generate and save notes
        print(f"\n📝 Generating {len(trades)} post-mortem notes...")
        for i, trade in enumerate(trades, 1):
            print(f"[{i}/{len(trades)}] {trade['symbol']} {trade['direction'].upper()}")
            markdown = self.generate_postmortem_markdown(trade)
            self.save_note_to_vault(trade, markdown)

        # Sync charts
        if chart_dir:
            print(f"\n📊 Syncing charts...")
            self.sync_charts(chart_dir)

        # Create index
        print(f"\n📑 Creating index...")
        self.create_trades_index(trades)

        print(f"\n✨ Sync complete!")
        print(f"   Vault location: {self.vault_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Sync trading post-mortems to Obsidian vault"
    )
    parser.add_argument("--vault", required=True, help="Obsidian vault directory path")
    parser.add_argument(
        "--db", required=True, help="SQLite database path (e.g., .db/trading.db)"
    )
    parser.add_argument(
        "--status",
        default="exited",
        choices=["exited", "closed", "all"],
        help="Trade status filter (default: exited)",
    )
    parser.add_argument(
        "--charts",
        help="Chart directory to sync (e.g., ./charts)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Max trades to process (default: 100)",
    )

    args = parser.parse_args()

    sync = ObsidianVaultSync(vault_path=args.vault, db_path=args.db)

    try:
        sync.sync_all(
            status=args.status,
            chart_dir=args.charts,
        )
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
