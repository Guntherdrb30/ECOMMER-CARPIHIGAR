import { safeQuery } from '../../utils/db';
import { log } from '../../utils/logger';

export async function getProductDetails(productId: string) {
  const sql = `
    select id, name, slug, description, images,
      coalesce(cast(priceclientusd as text), cast(priceusd as text)) as price_usd
    from products where id = $1
  `;
  const r = await safeQuery(sql, [productId]);
  if (r.error) { log('products.detail.error', { error: r.error, productId }); return null; }
  const row: any = r.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    images: row.images || [],
    priceUSD: row.price_usd ? Number(row.price_usd) : undefined,
  };
}

