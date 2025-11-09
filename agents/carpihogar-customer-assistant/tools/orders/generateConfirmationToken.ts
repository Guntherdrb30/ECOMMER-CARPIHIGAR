import { transaction } from '../../utils/db';
import { generateToken } from '../../utils/authToken';
import { sendWhatsappMessage } from '../../utils/sendWhatsappMessage';
import { log } from '../../utils/logger';

export async function generateConfirmationToken(input: { orderId: string; phone?: string }) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await transaction(async (db) => {
    await db.query('insert into order_auth_tokens (order_id, token, expires_at) values ($1,$2,$3)', [input.orderId, token, expiresAt]);
  });
  const phone = input.phone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '';
  const text = `Tu código de confirmación Carpihogar es: ${token}`;
  const r = await sendWhatsappMessage(phone, text);
  log('order.token.send', { orderId: input.orderId, ok: r.ok });
  return { ok: true };
}

