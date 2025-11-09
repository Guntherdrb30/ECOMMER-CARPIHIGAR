import { transaction } from '../../utils/db';
import { log } from '../../utils/logger';
import { ensureCustomerId } from '../../utils/customer';

export async function createOrderDraft(input: { customerId?: string }) {
  return transaction(async (db) => {
    const customerUuid = await ensureCustomerId(db, input.customerId);
    // Active cart
    const c = await db.query('select id from carts where customer_id = $1 and status = $2 limit 1', [customerUuid, 'ACTIVE']);
    const cartId = c.rows[0]?.id;
    if (!cartId) return { ok: false, error: 'No tienes productos en el carrito.' };
    const items = await db.query('select product_id, quantity, price_usd from cart_items where cart_id = $1', [cartId]);
    if (items.rowCount === 0) return { ok: false, error: 'El carrito está vacío.' };
    const total = items.rows.reduce((a: number, b: any) => a + Number(b.price_usd || 0) * Number(b.quantity || 0), 0);
    const ord = await db.query('insert into orders (customer_id, cart_id, total, status) values ($1,$2,$3,$4) returning id', [customerUuid, cartId, total, 'pending_confirmation']);
    const orderId = ord.rows[0].id;
    for (const it of items.rows) {
      await db.query('insert into order_items (order_id, product_id, quantity, price_usd) values ($1,$2,$3,$4)', [orderId, it.product_id, it.quantity, it.price_usd]);
    }
    log('order.draft', { customerId: input.customerId, orderId, total });
    return { ok: true, order: { id: orderId, total, status: 'pending_confirmation' } };
  });
}
