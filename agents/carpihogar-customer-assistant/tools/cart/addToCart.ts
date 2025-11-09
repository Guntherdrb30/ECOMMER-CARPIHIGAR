import { transaction } from '../../utils/db';
import { log } from '../../utils/logger';
import { ensureCustomerId } from '../../utils/customer';

export async function addToCart(input: { customerId?: string; productId: string; qty?: number }) {
  const qty = Math.max(1, Number(input.qty || 1));
  return transaction(async (db) => {
    const customerUuid = await ensureCustomerId(db, input.customerId);
    // Ensure cart exists
    const c1 = await db.query('select id from carts where customer_id = $1 and status = $2 limit 1', [customerUuid, 'ACTIVE']);
    const cartId = c1.rows[0]?.id || (await db.query('insert into carts (customer_id) values ($1) returning id', [input.customerId])).rows[0].id;
    // Get price from products
    const p = await db.query('select coalesce(cast(priceclientusd as text), cast(priceusd as text)) as price_usd from products where id = $1', [input.productId]);
    const price = Number(p.rows[0]?.price_usd || 0);
    // Upsert item
    const it = await db.query('select id, quantity from cart_items where cart_id = $1 and product_id = $2', [cartId, input.productId]);
    if (it.rowCount > 0) {
      const newQty = it.rows[0].quantity + qty;
      await db.query('update cart_items set quantity = $1, price_usd = $2 where id = $3', [newQty, price, it.rows[0].id]);
    } else {
      await db.query('insert into cart_items (cart_id, product_id, quantity, price_usd) values ($1,$2,$3,$4)', [cartId, input.productId, qty, price]);
    }
    await db.query('update carts set updated_at = now() where id = $1', [cartId]);
    log('cart.add', { customerId: customerUuid, productId: input.productId, qty });
    return { ok: true, cartId };
  });
}
