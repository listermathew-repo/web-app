/**
 * Database Schema V2 - Trade Review Enhancements
 * Adds columns for chart tracking, validation scores, and optimization indexes
 */

import Database from 'better-sqlite3';

export function migrateToV2(db: Database.Database): void {
  try {
    // Step 1: Add chart-related columns to trades table
    console.log('🔄 Migration V2: Adding chart columns to trades...');
    try {
      db.exec(`
        ALTER TABLE trades
        ADD COLUMN chart_generated_at DATETIME;
      `);
      console.log('  ✅ Added chart_generated_at');
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('  ⏭️  chart_generated_at already exists');
    }

    try {
      db.exec(`
        ALTER TABLE trades
        ADD COLUMN chart_html_path TEXT;
      `);
      console.log('  ✅ Added chart_html_path');
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('  ⏭️  chart_html_path already exists');
    }

    // Step 2: Add validation score to validation_log
    console.log('🔄 Migration V2: Adding validation score...');
    try {
      db.exec(`
        ALTER TABLE validation_log
        ADD COLUMN validation_score INTEGER;
      `);
      console.log('  ✅ Added validation_score');
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('  ⏭️  validation_score already exists');
    }

    // Step 3: Create obsidian_synced tracking table
    console.log('🔄 Migration V2: Creating obsidian_synced table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS obsidian_synced (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id TEXT UNIQUE NOT NULL,
        vault_path TEXT NOT NULL,
        synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        markdown_filename TEXT,
        chart_filename TEXT,
        FOREIGN KEY(trade_id) REFERENCES trades(id)
      );
    `);
    console.log('  ✅ Created obsidian_synced table');

    // Step 4: Create chart_cache table for generated charts
    console.log('🔄 Migration V2: Creating chart_cache table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS chart_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id TEXT UNIQUE NOT NULL,
        chart_json TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY(trade_id) REFERENCES trades(id)
      );
    `);
    console.log('  ✅ Created chart_cache table');

    // Step 5: Optimize indexes for performance
    console.log('🔄 Migration V2: Creating optimization indexes...');
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_trades_status_created ON trades(status, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_trades_symbol_status ON trades(symbol, status)`,
      `CREATE INDEX IF NOT EXISTS idx_validation_log_symbol_created ON validation_log(symbol, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_validation_log_valid ON validation_log(overall_valid)`,
      `CREATE INDEX IF NOT EXISTS idx_pending_trades_expires ON pending_trades(expires_at, status)`,
      `CREATE INDEX IF NOT EXISTS idx_chart_cache_expires ON chart_cache(expires_at)`,
      `CREATE INDEX IF NOT EXISTS idx_obsidian_synced_trade_id ON obsidian_synced(trade_id)`,
    ];

    for (const idx of indexes) {
      db.exec(idx);
    }
    console.log(`  ✅ Created ${indexes.length} optimization indexes`);

    // Step 6: Create trades_archive table for old data
    console.log('🔄 Migration V2: Creating archive table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS trades_archive (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL,
        entry_price REAL NOT NULL,
        stop_price REAL NOT NULL,
        retap_level REAL,
        size REAL,
        risk_amount INTEGER,
        deal_reference TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        executed_at DATETIME,
        exited_at DATETIME,
        exit_price REAL,
        pnl INTEGER,
        message TEXT,
        error_message TEXT,
        archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ Created trades_archive table');

    console.log('\n✅ Migration V2 complete!\n');
  } catch (err) {
    console.error('❌ Migration V2 failed:', err);
    throw err;
  }
}

/**
 * Calculate validation score (0-100) based on Check #9 criteria
 */
export function calculateValidationScore(validation: {
  ema_aligned?: boolean;
  vwap_confirmed?: boolean;
  volume_confirmed?: boolean;
  atr_valid?: boolean;
  candle_4h_valid?: boolean;
  overall_valid?: boolean;
}): number {
  let score = 0;
  const checks = [
    validation.ema_aligned,
    validation.vwap_confirmed,
    validation.volume_confirmed,
    validation.atr_valid,
    validation.candle_4h_valid,
  ];

  const passed = checks.filter((c) => c === true).length;
  const total = checks.filter((c) => c !== undefined).length;

  if (total > 0) {
    score = Math.round((passed / total) * 100);
  }

  return score;
}

/**
 * Archive old trades (older than N days)
 */
export function archiveOldTrades(db: Database.Database, daysOld: number = 90): number {
  const sql = `
    INSERT INTO trades_archive
    SELECT *, CURRENT_TIMESTAMP FROM trades
    WHERE status IN ('exited', 'closed')
      AND exited_at < datetime('now', '-' || ? || ' days')
      AND id NOT IN (SELECT id FROM trades_archive);
  `;

  const stmt = db.prepare(sql);
  const result = stmt.run(daysOld);
  console.log(`📦 Archived ${result.changes} trades older than ${daysOld} days`);

  // Delete archived trades from main table
  const deleteSql = `
    DELETE FROM trades
    WHERE id IN (SELECT id FROM trades_archive WHERE archived_at < datetime('now', '-7 days'));
  `;
  db.exec(deleteSql);

  return result.changes as number;
}

/**
 * Prune expired chart cache
 */
export function pruneChartCache(db: Database.Database): number {
  const sql = `
    DELETE FROM chart_cache
    WHERE expires_at < CURRENT_TIMESTAMP;
  `;

  const stmt = db.prepare(sql);
  const result = stmt.run();
  console.log(`🗑️  Pruned ${result.changes} expired charts from cache`);
  return result.changes as number;
}

/**
 * Get database statistics
 */
export function getDbStats(db: Database.Database): {
  totalTrades: number;
  pendingTrades: number;
  validatedTrades: number;
  archivedTrades: number;
  chartsCached: number;
} {
  const stats = {
    totalTrades: db.prepare('SELECT COUNT(*) as count FROM trades').get() as any,
    pendingTrades: db
      .prepare("SELECT COUNT(*) as count FROM pending_trades WHERE status = 'pending'")
      .get() as any,
    validatedTrades: db
      .prepare('SELECT COUNT(*) as count FROM validation_log WHERE overall_valid = 1')
      .get() as any,
    archivedTrades: db.prepare('SELECT COUNT(*) as count FROM trades_archive').get() as any,
    chartsCached: db.prepare('SELECT COUNT(*) as count FROM chart_cache').get() as any,
  };

  return {
    totalTrades: stats.totalTrades.count,
    pendingTrades: stats.pendingTrades.count,
    validatedTrades: stats.validatedTrades.count,
    archivedTrades: stats.archivedTrades.count,
    chartsCached: stats.chartsCached.count,
  };
}
