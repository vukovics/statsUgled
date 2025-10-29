import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;
let initPromise: Promise<void> | null = null;

async function initDatabase(): Promise<void> {
  if (db) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      const dbPath = path.join(process.cwd(), 'database', 'sales.db');

      console.log('Initializing sql.js database');
      console.log('Database path:', dbPath);
      console.log('File exists:', fs.existsSync(dbPath));

      // Initialize SQL.js with local WASM file
      const SQL = await initSqlJs({
        locateFile: (file) => {
          // In build/runtime, use the local file from node_modules
          const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
          return wasmPath;
        }
      });

      // Read database file
      const buffer = fs.readFileSync(dbPath);
      console.log('Database file loaded, size:', buffer.length, 'bytes');

      // Create database from buffer
      db = new SQL.Database(buffer);
      console.log('Database opened successfully with sql.js');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  })();

  await initPromise;
}

export async function getDatabase(): Promise<Database> {
  await initDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    db.close();
    db = null;
    initPromise = null;
  }
}

// Helper function to run queries
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDatabase();
  const results = database.exec(sql, params);

  if (results.length === 0) {
    return [];
  }

  const result = results[0];
  const columns = result.columns;
  const values = result.values;

  return values.map(row => {
    const obj: any = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj as T;
  });
}

// Helper function to run a single query
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const results = await query<T>(sql, params);
  return results[0];
}

// Helper function to run insert/update/delete
export async function execute(sql: string, params: any[] = []): Promise<any> {
  const database = await getDatabase();
  database.run(sql, params);
  return { changes: database.getRowsModified() };
}
