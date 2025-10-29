import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'database', 'sales.db');
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Helper function to run queries
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

// Helper function to run a single query
export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

// Helper function to run insert/update/delete
export function execute(sql: string, params: any[] = []): Database.RunResult {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}
