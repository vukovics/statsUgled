import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
  }
  return pool;
}

// Helper function to run queries
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

// Helper function to run a single query
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rows[0] as T | undefined;
}

// Helper function to run insert/update/delete
export async function execute(sql: string, params: any[] = []): Promise<any> {
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result;
}
