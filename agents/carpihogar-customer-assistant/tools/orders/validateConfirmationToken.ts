import { transaction } from '../../utils/db';
import { validateToken } from '../../utils/authToken';
import { log } from '../../utils/logger';

export async function validateConfirmationToken(input: { orderId: string; token: string }) {
  return transaction(async (db) => {
    const t = await db.query('select token, expires_at, used_at from order_auth_tokens where order_id = $1 order by created_at desc limit 1', [input.orderId]);
    if (t.rowCount === 0) return { ok: false, error: 'Token no encontrado.' };
    const row = t.rows[0] as any;
    if (row.used_at) return { ok: false, error: 'Token ya usado.' };
    const now = Date.now();
    if (new Date(row.expires_at).getTime() < now) return { ok: false, error: 'Token expirado.' };
    if (!validateToken(input.token, row.token)) return { ok: false, error: 'Token inválido.' };
    await db.query('update order_auth_tokens set used_at = now() where order_id = $1 and token = $2', [input.orderId, row.token]);
    await db.query("update orders set status = 'awaiting_payment', updated_at = now() where id = $1", [input.orderId]);
    log('order.token.validated', { orderId: input.orderId });
    return { ok: true };
  });
}

