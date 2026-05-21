import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const dbPath = path.join(process.cwd(), '.db', 'trading.db');

// Ensure .db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database (synchronous, serverless-compatible)
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    console.log(`Database connected: ${dbPath}`);
  }
  return db;
}

// Wrapper functions for database operations
function run(sql: string, params: any[] = []): { lastID?: number; changes?: number } {
  const stmt = getDatabase().prepare(sql);
  const info = stmt.run(...params);
  return { lastID: info.lastInsertRowid as number, changes: info.changes };
}

function get(sql: string, params: any[] = []): any {
  const stmt = getDatabase().prepare(sql);
  return stmt.get(...params);
}

function all(sql: string, params: any[] = []): any[] {
  const stmt = getDatabase().prepare(sql);
  return stmt.all(...params);
}

// Initialize schema
export function initializeDatabase() {
  const db = getDatabase();

  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS pending_trades (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      entry_level REAL NOT NULL,
      stop_level REAL NOT NULL,
      retap_level REAL,
      risk_amount INTEGER,
      scenario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      status TEXT DEFAULT 'pending',
      approved_at DATETIME,
      approved_by TEXT DEFAULT 'manual',
      execution_price REAL,
      deal_reference TEXT,
      error_message TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS trades (
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
      error_message TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS system_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
      error_count INTEGER DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS alert_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      level TEXT NOT NULL,
      price REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE INDEX IF NOT EXISTS idx_pending_trades_symbol ON pending_trades(symbol)`,
    `CREATE INDEX IF NOT EXISTS idx_pending_trades_status ON pending_trades(status)`,
    `CREATE INDEX IF NOT EXISTS idx_pending_trades_created_at ON pending_trades(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol)`,
    `CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status)`,
    `CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_alert_log_symbol ON alert_log(symbol)`,
    `CREATE INDEX IF NOT EXISTS idx_alert_log_timestamp ON alert_log(timestamp)`,
  ];

  try {
    for (const statement of schemaStatements) {
      db.exec(statement);
    }
    console.log('Database schema initialized');
  } catch (err) {
    console.error('Schema initialization error:', err);
    throw err;
  }
}

// Database operations
export const dbOps = {
  // Pending trades
  insertPendingTrade: (trade: {
    id: string;
    symbol: string;
    direction: string;
    entry_level: number;
    stop_level: number;
    retap_level?: number;
    risk_amount?: number;
    scenario?: string;
  }) => {
    const sql = `
      INSERT INTO pending_trades
      (id, symbol, direction, entry_level, stop_level, retap_level, risk_amount, scenario)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return run(sql, [
      trade.id,
      trade.symbol,
      trade.direction,
      trade.entry_level,
      trade.stop_level,
      trade.retap_level,
      trade.risk_amount,
      trade.scenario,
    ]);
  },

  getPendingTrades: () => {
    const sql = `
      SELECT * FROM pending_trades
      WHERE status = 'pending' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC
    `;
    return all(sql);
  },

  getPendingTradeById: (id: string) => {
    const sql = 'SELECT * FROM pending_trades WHERE id = ?';
    return get(sql, [id]);
  },

  approvePendingTrade: (id: string, executionPrice: number, dealReference: string) => {
    const sql = `
      UPDATE pending_trades
      SET status = 'approved', approved_at = CURRENT_TIMESTAMP, execution_price = ?, deal_reference = ?
      WHERE id = ?
    `;
    return run(sql, [executionPrice, dealReference, id]);
  },

  rejectPendingTrade: (id: string, reason: string) => {
    const sql = `
      UPDATE pending_trades
      SET status = 'rejected', error_message = ?
      WHERE id = ?
    `;
    return run(sql, [reason, id]);
  },

  // Trades
  insertTrade: (trade: {
    id: string;
    symbol: string;
    direction: string;
    entry_price: number;
    stop_price: number;
    retap_level?: number;
    size?: number;
    risk_amount?: number;
    status: string;
    message?: string;
  }) => {
    const sql = `
      INSERT INTO trades
      (id, symbol, direction, entry_price, stop_price, retap_level, size, risk_amount, status, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return run(sql, [
      trade.id,
      trade.symbol,
      trade.direction,
      trade.entry_price,
      trade.stop_price,
      trade.retap_level,
      trade.size,
      trade.risk_amount,
      trade.status,
      trade.message,
    ]);
  },

  updateTradeStatus: (id: string, status: string, dealReference?: string, executionPrice?: number) => {
    const sql = `
      UPDATE trades
      SET status = ?, deal_reference = ?, execution_price = ?, executed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    return run(sql, [status, dealReference, executionPrice, id]);
  },

  getTradeHistory: (filters?: { symbol?: string; status?: string; since?: string; until?: string }) => {
    let query = 'SELECT * FROM trades WHERE 1=1';
    const params: any[] = [];

    if (filters?.symbol) {
      query += ' AND symbol = ?';
      params.push(filters.symbol);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.since) {
      query += ' AND created_at >= ?';
      params.push(filters.since);
    }
    if (filters?.until) {
      query += ' AND created_at <= ?';
      params.push(filters.until);
    }

    query += ' ORDER BY created_at DESC';
    return all(query, params);
  },

  getTradeById: (id: string) => {
    const sql = 'SELECT * FROM trades WHERE id = ?';
    return get(sql, [id]);
  },

  // Health
  logHealth: (component: string, status: string, message?: string) => {
    const sql = `
      INSERT INTO system_health (component, status, message)
      VALUES (?, ?, ?)
    `;
    return run(sql, [component, status, message]);
  },

  // Alert log
  logAlert: (symbol: string, level: string, price: number) => {
    const sql = `
      INSERT INTO alert_log (symbol, level, price)
      VALUES (?, ?, ?)
    `;
    return run(sql, [symbol, level, price]);
  },

  // Open positions (for /api/positions endpoint)
  getOpenPositions: () => {
    const sql = `
      SELECT * FROM trades
      WHERE status NOT IN ('exited', 'closed', 'failed')
      ORDER BY created_at DESC
    `;
    return all(sql);
  },

  // Cleanup
  autoCleanupExpiredTrades: () => {
    const sql = `
      UPDATE pending_trades
      SET status = 'rejected', error_message = 'Expired (5 min limit)'
      WHERE status = 'pending' AND created_at < datetime('now', '-5 minutes')
    `;
    return run(sql);
  },
};

export default getDatabase;
