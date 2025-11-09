import { transaction } from '../../utils/db';

export async function submitManualPayment(input: { orderId: string; method: string; amountUSD: number; reference?: string }) {
  return transaction(async (db) => {
    await db.query('insert into order_pending_payments (order_id, method, amount, reference, status) values ($1,$2,$3,$4,$5)', [
      input.orderId, input.method, input.amountUSD, input.reference || null, 'submitted'
    ]);
    await db.query("update orders set status = 'payment_pending_review', updated_at = now() where id = $1", [input.orderId]);
    return { ok: true };
  });
}

