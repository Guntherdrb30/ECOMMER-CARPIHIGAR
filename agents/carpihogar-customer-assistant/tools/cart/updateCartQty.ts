import { transaction } from '../../utils/db';
import { ensureCustomerId } from '../../utils/customer';

export async function updateCartQty(input: { customerId?: string; productId: string; qty: number }) {
  const qty = Math.max(0, Number(input.qty || 0));
  return transaction(async (db) => {
    const customerUuid = await ensureCustomerId(db, input.customerId);
    const c1 = await db.query('select id from carts where customer_id = $1 and status = $2 limit 1', [customerUuid, 'ACTIVE']);
    const cartId = c1.rows[0]?.id || (await db.query('insert into carts (customer_id) values ($1) returning id', [customerUuid])).rows[0].id;
    if (qty <= 0) {
      await db.query('delete from cart_items where cart_id = $1 and product_id = $2', [cartId, input.productId]);
    } else {
      // Ensure row exists
      const it = await db.query('select id from cart_items where cart_id = $1 and product_id = $2', [cartId, input.productId]);
      if (it.rowCount === 0) {
        // need price
        const p = await db.query('select coalesce(cast(priceclientusd as text), cast(priceusd as text)) as price_usd from products where id = $1', [input.productId]);
        const price = Number(p.rows[0]?.price_usd || 0);
        await db.query('insert into cart_items (cart_id, product_id, quantity, price_usd) values ($1,$2,$3,$4)', [cartId, input.productId, qty, price]);
      } else {
        await db.query('update cart_items set quantity = $1 where cart_id = $2 and product_id = $3', [qty, cartId, input.productId]);
      }
    }
    await db.query('update carts set updated_at = now() where id = $1', [cartId]);
    return { ok: true, cartId };
  });
}

