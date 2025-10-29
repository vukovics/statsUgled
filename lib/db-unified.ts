// Unified database interface - works with both SQLite (local) and Postgres (production)
import Database from 'better-sqlite3';
import path from 'path';
import { Pool } from 'pg';

const USE_POSTGRES = process.env.POSTGRES_URL !== undefined;

// SQLite setup
let sqliteDb: Database.Database | null = null;

function getSQLiteDatabase(): Database.Database {
  if (!sqliteDb) {
    const dbPath = path.join(process.cwd(), 'database', 'sales.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
  }
  return sqliteDb;
}

// Postgres setup
let pgPool: Pool | null = null;

function getPostgresPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
  }
  return pgPool;
}

// Convert SQLite placeholders (?) to Postgres placeholders ($1, $2, etc.)
function convertPlaceholders(sql: string, params: any[]): { sql: string; params: any[] } {
  if (!USE_POSTGRES) {
    return { sql, params };
  }

  let paramIndex = 1;
  const convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  return { sql: convertedSql, params };
}

// Helper function to run queries
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (USE_POSTGRES) {
    const pool = getPostgresPool();
    const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return result.rows as T[];
  } else {
    const db = getSQLiteDatabase();
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  }
}

// Helper function to run a single query
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  if (USE_POSTGRES) {
    const pool = getPostgresPool();
    const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return result.rows[0] as T | undefined;
  } else {
    const db = getSQLiteDatabase();
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }
}

// Helper function to run insert/update/delete
export async function execute(sql: string, params: any[] = []): Promise<any> {
  if (USE_POSTGRES) {
    const pool = getPostgresPool();
    const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return result;
  } else {
    const db = getSQLiteDatabase();
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  }
}

export function closeDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (pgPool) {
    pgPool.end();
    pgPool = null;
  }
}
