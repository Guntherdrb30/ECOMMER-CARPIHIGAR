import { safeQuery } from '../../utils/db';
import { ensureCustomerId } from '../../utils/customer';

export async function viewCart(input: { customerId?: string }) {
  const cid = String(input.customerId || '');
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(cid);
  let cartId: string | null = null;
  if (cid) {
    if (isUuid) {
      const c = await safeQuery('select id from carts where customer_id = $1 and status = $2 limit 1', [cid, 'ACTIVE']);
      cartId = (c.rows[0] as any)?.id || null;
    } else {
      const c = await safeQuery('select ca.id from carts ca join customers cu on cu.id = ca.customer_id where cu.external_id = $1 and ca.status = $2 limit 1', [cid, 'ACTIVE']);
      cartId = (c.rows[0] as any)?.id || null;
    }
  }
  if (!cartId) return { cart: { id: null, items: [], totalUSD: 0 } };
  const cartId = (c.rows[0] as any)?.id;
  if (!cartId) return { cart: { id: null, items: [], totalUSD: 0 } };
  const itemsSql = `
    select ci.product_id, ci.quantity, ci.price_usd,
           p.name, p.slug, p.images
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.cart_id = $1
  `;
  const r = await safeQuery(itemsSql, [cartId]);
  const items = (r.rows || []).map((row: any) => ({
    productId: row.product_id,
    name: row.name,
    slug: row.slug,
    images: row.images || [],
    quantity: Number(row.quantity || 0),
    priceUSD: Number(row.price_usd || 0),
    lineUSD: Number(row.price_usd || 0) * Number(row.quantity || 0),
  }));
  const totalUSD = items.reduce((a, b) => a + b.lineUSD, 0);
  return { cart: { id: cartId, items, totalUSD } };
}
