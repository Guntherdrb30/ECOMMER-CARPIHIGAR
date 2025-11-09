import { transaction } from '../../utils/db';
import { log } from '../../utils/logger';
import { ensureCustomerId } from '../../utils/customer';

export async function removeFromCart(input: { customerId?: string; productId: string }) {
  return transaction(async (db) => {
    const customerUuid = await ensureCustomerId(db, input.customerId);
    const c1 = await db.query('select id from carts where customer_id = $1 and status = $2 limit 1', [customerUuid, 'ACTIVE']);
    const cartId = c1.rows[0]?.id;
    if (!cartId) return { ok: true };
    await db.query('delete from cart_items where cart_id = $1 and product_id = $2', [cartId, input.productId]);
    await db.query('update carts set updated_at = now() where id = $1', [cartId]);
    log('cart.remove', { customerId: customerUuid, productId: input.productId });
    return { ok: true, cartId };
  });
}
