/**
 * Database Migrations for Trading System
 * Run these to upgrade schema for strategy tracking and R:R backtesting
 */

import Database from 'better-sqlite3';

export function migrateToStrategyTracking(db: Database.Database): void {
  console.log('Running migration: Add strategy tracking columns...');

  try {
    // Add strategy column to trades table
    const checkStrategy = db
      .prepare(`PRAGMA table_info(trades)`)
      .all()
      .some((col: any) => col.name === 'strategy');

    if (!checkStrategy) {
      db.exec(`
        ALTER TABLE trades ADD COLUMN strategy TEXT DEFAULT 'scenario_1';
      `);
      console.log('✅ Added trades.strategy column');
    } else {
      console.log('⏭️  trades.strategy column already exists');
    }

    // Add rr_ratio column to trades table
    const checkRRRatio = db
      .prepare(`PRAGMA table_info(trades)`)
      .all()
      .some((col: any) => col.name === 'rr_ratio');

    if (!checkRRRatio) {
      db.exec(`
        ALTER TABLE trades ADD COLUMN rr_ratio REAL DEFAULT 2.0;
      `);
      console.log('✅ Added trades.rr_ratio column');
    } else {
      console.log('⏭️  trades.rr_ratio column already exists');
    }

    // Add participation_level column to trades table
    const checkParticipation = db
      .prepare(`PRAGMA table_info(trades)`)
      .all()
      .some((col: any) => col.name === 'participation_level');

    if (!checkParticipation) {
      db.exec(`
        ALTER TABLE trades ADD COLUMN participation_level TEXT DEFAULT 'standard';
      `);
      console.log('✅ Added trades.participation_level column');
    } else {
      console.log('⏭️  trades.participation_level column already exists');
    }
  } catch (err) {
    console.error('Migration error (strategy tracking):', err);
    throw err;
  }
}

export function migrateCreateRRAnalysisTable(db: Database.Database): void {
  console.log('Running migration: Create rr_analysis table...');

  try {
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='rr_analysis'`
      )
      .get();

    if (!tableExists) {
      db.exec(`
        CREATE TABLE rr_analysis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          strategy TEXT NOT NULL,
          symbol TEXT NOT NULL,
          rr_ratio REAL NOT NULL,
          sample_size INTEGER DEFAULT 0,
          win_count INTEGER DEFAULT 0,
          loss_count INTEGER DEFAULT 0,
          win_rate REAL DEFAULT 0.0,
          avg_win REAL DEFAULT 0.0,
          avg_loss REAL DEFAULT 0.0,
          expectancy REAL DEFAULT 0.0,
          sharpe_ratio REAL,
          sortino_ratio REAL,
          max_drawdown REAL,
          profit_factor REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(strategy, symbol, rr_ratio)
        );
      `);

      // Create index for faster queries
      db.exec(`
        CREATE INDEX idx_rr_analysis_strategy_symbol
        ON rr_analysis(strategy, symbol);
      `);

      console.log('✅ Created rr_analysis table');
    } else {
      console.log('⏭️  rr_analysis table already exists');
    }
  } catch (err) {
    console.error('Migration error (rr_analysis table):', err);
    throw err;
  }
}

export function migrateCreateBacktestResultsTable(db: Database.Database): void {
  console.log('Running migration: Create backtest_results table...');

  try {
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='backtest_results'`
      )
      .get();

    if (!tableExists) {
      db.exec(`
        CREATE TABLE backtest_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_run_id TEXT NOT NULL,
          strategy TEXT NOT NULL,
          symbol TEXT NOT NULL,
          rr_ratio REAL NOT NULL,
          iteration INTEGER,
          sequence_start INTEGER,
          sequence_end INTEGER,
          trades_in_sequence INTEGER,
          winning_trades INTEGER,
          losing_trades INTEGER,
          total_return REAL,
          max_drawdown REAL,
          sharpe_ratio REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      db.exec(`
        CREATE INDEX idx_backtest_test_run
        ON backtest_results(test_run_id, strategy, symbol, rr_ratio);
      `);

      console.log('✅ Created backtest_results table');
    } else {
      console.log('⏭️  backtest_results table already exists');
    }
  } catch (err) {
    console.error('Migration error (backtest_results table):', err);
    throw err;
  }
}

export function runAllMigrations(db: Database.Database): void {
  console.log('\n🔄 Running all database migrations...\n');

  migrateToStrategyTracking(db);
  migrateCreateRRAnalysisTable(db);
  migrateCreateBacktestResultsTable(db);

  console.log('\n✅ All migrations completed\n');
}
