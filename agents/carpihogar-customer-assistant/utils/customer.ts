import { query } from './db';

export async function ensureCustomerId(db: any, externalId?: string | null): Promise<string> {
  // If external id present, map to customers.external_id
  if (externalId) {
    const found = await db.query('select id from customers where external_id = $1 limit 1', [externalId]);
    if (found.rowCount > 0) return found.rows[0].id;
    const created = await db.query('insert into customers (external_id) values ($1) returning id', [externalId]);
    return created.rows[0].id;
  }
  // Anonymous: create a new customer row
  const created = await db.query('insert into customers default values returning id');
  return created.rows[0].id;
}

