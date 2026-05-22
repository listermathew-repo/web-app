-- Trading Rules Engine - Performance Monitoring Queries
-- Use these queries to analyze rule performance and identify optimization opportunities
-- Database: .db/trading.db (SQLite)

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 1: Win Rate by Rule Version
-- ════════════════════════════════════════════════════════════════════════════════
-- Shows which rule version has the best win rate
-- Helps compare v1.0 vs v1.1 rule changes

SELECT
  rule_version,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades,
  COUNT(CASE WHEN pnl <= 0 THEN 1 END) as losing_trades,
  ROUND(100.0 * COUNT(CASE WHEN pnl > 0 THEN 1 END) / COUNT(*), 2) as win_rate_pct,
  ROUND(AVG(pnl), 2) as avg_pnl,
  SUM(pnl) as total_pnl
FROM trades
WHERE status IN ('exited', 'closed')
  AND rule_version IS NOT NULL
GROUP BY rule_version
ORDER BY win_rate_pct DESC;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 2: Which Conditions Reject Most Trades?
-- ════════════════════════════════════════════════════════════════════════════════
-- Identifies which of the 4 conditions is too strict
-- If price_vwap fails 60% of trades, may need to loosen tolerance

SELECT
  json_extract(value, '$.id') as condition_id,
  json_extract(value, '$.name') as condition_name,
  COUNT(*) as times_checked,
  COUNT(CASE WHEN json_extract(value, '$.passed') = 1 THEN 1 END) as times_passed,
  COUNT(CASE WHEN json_extract(value, '$.passed') = 0 THEN 1 END) as times_failed,
  ROUND(100.0 * COUNT(CASE WHEN json_extract(value, '$.passed') = 1 THEN 1 END) / COUNT(*), 2) as pass_rate_pct
FROM trades, json_each(trades.rule_conditions_met)
WHERE rule_version = '1.0'
GROUP BY json_extract(value, '$.id')
ORDER BY times_failed DESC;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 3: Win Rate by Condition
-- ════════════════════════════════════════════════════════════════════════════════
-- Shows which conditions, when they pass, lead to more wins
-- Validates that the conditions are predictive of profitable trades

SELECT
  json_extract(value, '$.id') as condition_id,
  COUNT(CASE WHEN json_extract(value, '$.passed') = 1 THEN 1 END) as trades_where_passed,
  COUNT(CASE WHEN json_extract(value, '$.passed') = 1 AND t.pnl > 0 THEN 1 END) as wins_when_passed,
  ROUND(100.0 * COUNT(CASE WHEN json_extract(value, '$.passed') = 1 AND t.pnl > 0 THEN 1 END)
    / COUNT(CASE WHEN json_extract(value, '$.passed') = 1 THEN 1 END), 2) as win_rate_pct
FROM trades t, json_each(t.rule_conditions_met)
WHERE t.status IN ('exited', 'closed')
  AND t.rule_version = '1.0'
GROUP BY json_extract(value, '$.id')
ORDER BY win_rate_pct DESC;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 4: Average P&L by Entry Condition Count
-- ════════════════════════════════════════════════════════════════════════════════
-- Shows if stricter entry (all 4 conditions) actually leads to better P&L
-- Expected: More conditions = higher win rate and avg P&L

SELECT
  json_extract(rule_conditions_met, '$.conditions_passed') as conditions_met,
  COUNT(*) as total_trades,
  ROUND(AVG(pnl), 2) as avg_pnl,
  ROUND(SUM(pnl), 2) as total_pnl,
  COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins,
  ROUND(100.0 * COUNT(CASE WHEN pnl > 0 THEN 1 END) / COUNT(*), 2) as win_rate_pct
FROM trades
WHERE status IN ('exited', 'closed')
  AND rule_version = '1.0'
GROUP BY conditions_met
ORDER BY conditions_met DESC;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 5: Pre-Entry Check Failures
-- ════════════════════════════════════════════════════════════════════════════════
-- Shows how often pre-entry checks blocked trades
-- Helps identify if limits are too strict (e.g., daily profit cap never triggered)

SELECT
  json_extract(pre_entry_checks, '$.ny_open') as ny_open_check,
  COUNT(*) as total_rejections
FROM trades
WHERE direction IN ('long', 'short')
GROUP BY ny_open_check;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 6: Risk/Reward Ratio Distribution
-- ════════════════════════════════════════════════════════════════════════════════
-- Shows if trades have sufficient profit potential
-- Looking for: Most trades >= 2.0 RR ratio

SELECT
  CASE
    WHEN (retap_level - entry_price) / ABS(entry_price - stop_price) < 1.0 THEN '< 1:1 (no edge)'
    WHEN (retap_level - entry_price) / ABS(entry_price - stop_price) < 1.5 THEN '1:1 - 1.5:1'
    WHEN (retap_level - entry_price) / ABS(entry_price - stop_price) < 2.0 THEN '1.5:1 - 2.0:1'
    ELSE '>= 2.0:1 (good)'
  END as rr_category,
  COUNT(*) as trade_count,
  ROUND(AVG(pnl), 2) as avg_pnl,
  COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins
FROM trades
WHERE status IN ('exited', 'closed')
  AND direction = 'long'
GROUP BY rr_category
ORDER BY rr_category DESC;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 7: Trades Executed By Hour (to identify best trading windows)
-- ════════════════════════════════════════════════════════════════════════════════
-- Shows if certain hours have better results
-- Can guide when to be more/less aggressive with risk

SELECT
  strftime('%H:00', executed_at) as execution_hour,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins,
  ROUND(100.0 * COUNT(CASE WHEN pnl > 0 THEN 1 END) / COUNT(*), 2) as win_rate_pct,
  ROUND(AVG(pnl), 2) as avg_pnl
FROM trades
WHERE status IN ('exited', 'closed')
  AND executed_at IS NOT NULL
GROUP BY strftime('%H:00', executed_at)
ORDER BY execution_hour;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 8: P&L Metrics (Daily Summary)
-- ════════════════════════════════════════════════════════════════════════════════
-- Shows daily profitability and how many trades per day

SELECT
  DATE(executed_at) as trading_date,
  COUNT(*) as trades_executed,
  COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins,
  COUNT(CASE WHEN pnl <= 0 THEN 1 END) as losses,
  ROUND(SUM(pnl), 2) as daily_pnl,
  ROUND(AVG(pnl), 2) as avg_pnl_per_trade,
  ROUND(AVG(CASE WHEN pnl > 0 THEN pnl END), 2) as avg_win,
  ROUND(AVG(CASE WHEN pnl <= 0 THEN pnl END), 2) as avg_loss
FROM trades
WHERE status IN ('exited', 'closed')
  AND executed_at IS NOT NULL
GROUP BY DATE(executed_at)
ORDER BY trading_date DESC;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 9: Best and Worst Trades
-- ════════════════════════════════════════════════════════════════════════════════
-- Top winners and worst losers for analysis

-- Top 5 winning trades
SELECT 'TOP 5 WINS' as category, symbol, direction, entry_price, exit_price, pnl, executed_at
FROM trades
WHERE status IN ('exited', 'closed')
  AND pnl > 0
ORDER BY pnl DESC
LIMIT 5
UNION ALL
-- Top 5 worst losses
SELECT 'TOP 5 LOSSES' as category, symbol, direction, entry_price, exit_price, pnl, executed_at
FROM trades
WHERE status IN ('exited', 'closed')
  AND pnl <= 0
ORDER BY pnl ASC
LIMIT 5;

-- ════════════════════════════════════════════════════════════════════════════════
-- QUERY 10: Rule A/B Test Comparison (v1.0 vs v1.1)
-- ════════════════════════════════════════════════════════════════════════════════
-- Once you create v1.1 rules, use this to compare performance

SELECT
  rule_version,
  COUNT(*) as total_trades,
  ROUND(100.0 * COUNT(CASE WHEN pnl > 0 THEN 1 END) / COUNT(*), 2) as win_rate_pct,
  ROUND(AVG(pnl), 2) as avg_pnl,
  SUM(pnl) as total_pnl,
  ROUND(SUM(pnl) / COUNT(*), 2) as pnl_per_trade,
  MIN(pnl) as worst_loss,
  MAX(pnl) as best_win
FROM trades
WHERE status IN ('exited', 'closed')
  AND rule_version IN ('1.0', '1.1')
GROUP BY rule_version
ORDER BY win_rate_pct DESC;

-- ════════════════════════════════════════════════════════════════════════════════
-- HOW TO USE THESE QUERIES
-- ════════════════════════════════════════════════════════════════════════════════
-- 1. Install SQLite command line: sqlite3 (comes with most systems)
-- 2. Run a query:
--    sqlite3 .db/trading.db "SELECT * FROM trades WHERE pnl > 0;"
-- 3. Or open interactive shell:
--    sqlite3 .db/trading.db
--    SQLite> .read scripts/rule-performance-queries.sql
-- 4. For better formatting, use:
--    sqlite3 -header -column .db/trading.db "SELECT * FROM trades LIMIT 5;"
-- ════════════════════════════════════════════════════════════════════════════════
