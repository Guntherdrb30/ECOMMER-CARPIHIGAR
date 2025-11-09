// Avoid hard dependency on 'pg' types during build to prevent bundler errors
type PgPoolType = any;
type QueryResult<T = any> = { rows: T[]; rowCount: number };

let pool: PgPoolType | null = null;

async function getPool(): Promise<PgPoolType> {
  if (pool) return pool;
  // Lazy import to avoid forcing dependency unless used
  const { Pool: PgPool } = await import('pg');
  const connectionString = process.env.DATABASE_URL || '';
  pool = new PgPool({ connectionString, ssl: { rejectUnauthorized: false } as any });
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const p = await getPool();
  return p.query<T>(text, params);
}

export async function safeQuery<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number; error?: string }>{
  try {
    const r = await query<T>(text, params);
    return { rows: r.rows, rowCount: r.rowCount };
  } catch (e: any) {
    return { rows: [], rowCount: 0, error: String(e?.message || e) };
  }
}

export async function transaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const p = await getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    throw e;
  } finally {
    client.release();
  }
}
