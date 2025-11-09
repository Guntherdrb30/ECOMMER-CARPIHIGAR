/*
 Run: npm run agent:db:setup
 Applies agents/carpihogar-customer-assistant/database/schema.sql to DATABASE_URL
*/
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const { Pool } = await import('pg');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } as any });
  const sqlPath = join(process.cwd(), 'agents', 'carpihogar-customer-assistant', 'database', 'schema.sql');
  const sql = readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Schema applied successfully.');
  } catch (e: any) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Error applying schema:', e?.message || e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

