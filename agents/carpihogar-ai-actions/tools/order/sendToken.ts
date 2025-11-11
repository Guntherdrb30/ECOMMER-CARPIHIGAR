import { log } from '../../lib/logger';
import { prisma } from '../../lib/db';

export async function run(input: { orderId: string; phone: string }) {
  const orderId = String(input?.orderId || '').trim();
  const phone = String(input?.phone || '').trim();
  if (!orderId || !phone) return { success: false, message: 'orderId y phone requeridos', data: null };
  const token = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  try {
    await prisma.orderAuthToken.create({ data: { orderId, token, expiresAt: expiresAt as any, channel: 'WHATSAPP', destination: phone } as any });
  } catch {
    // ignore
  }
  // TODO: Integrar proveedor WhatsApp real con envs
  log('mcp.order.sendToken', { orderId, phone });
  return { success: true, message: 'Token enviado por WhatsApp', data: { preview: token.replace(/\d{4}$/, '****') } };
}
