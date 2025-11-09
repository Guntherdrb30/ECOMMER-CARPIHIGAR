import { safeQuery } from '../../utils/db';
import { log } from '../../utils/logger';

export async function searchProducts(queryText: string) {
  const q = `%${queryText}%`;
  const sql = `
    select id, name, slug,
      coalesce(cast(priceclientusd as text), cast(priceusd as text)) as price_usd,
      images
    from products
    where name ilike $1
    order by createdat desc
    limit 20
  `;
  const r = await safeQuery(sql, [q]);
  if (r.error) log('products.search.error', { error: r.error, q: queryText });
  const items = (r.rows || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    images: row.images || [],
    priceUSD: row.price_usd ? Number(row.price_usd) : undefined,
  }));
  log('products.search', { q: queryText, count: items.length });
  return items;
}

