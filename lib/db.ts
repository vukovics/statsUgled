import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'database', 'sales.db');

    try {
      console.log('Database path:', dbPath);
      console.log('File exists:', fs.existsSync(dbPath));
      console.log('CWD:', process.cwd());

      try {
        const files = fs.readdirSync(process.cwd());
        console.log('Files in CWD:', files);

        if (fs.existsSync(path.join(process.cwd(), 'database'))) {
          const dbFiles = fs.readdirSync(path.join(process.cwd(), 'database'));
          console.log('Files in database folder:', dbFiles);
        }
      } catch (e) {
        console.log('Could not read directory:', e);
      }

      db = new Database(dbPath, { readonly: true, fileMustExist: true });
      console.log('Database opened successfully');
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
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
