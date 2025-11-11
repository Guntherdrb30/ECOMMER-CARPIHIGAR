import { log } from '../../lib/logger';
import { prisma } from '../../lib/db';

export async function run(input: { orderId: string; token?: string; confirmText?: string }) {
  const orderId = String(input?.orderId || '').trim();
  const token = String(input?.token || '').trim();
  const confirmText = String(input?.confirmText || '').toLowerCase();
  if (!orderId) return { success: false, message: 'orderId requerido', data: null };
  if (confirmText.includes('sí autorizo') || confirmText.includes('si autorizo')) {
    log('mcp.order.validateToken.confirmText', { orderId });
    return { success: true, message: 'Autorizado por texto', data: null };
  }
  if (!token) return { success: false, message: 'token requerido', data: null };
  const rec = await prisma.orderAuthToken.findFirst({ where: { orderId, token } });
  if (!rec) return { success: false, message: 'Token inválido', data: null };
  if (rec.usedAt) return { success: false, message: 'Token ya usado', data: null };
  if (rec.expiresAt && rec.expiresAt < (new Date() as any)) return { success: false, message: 'Token expirado', data: null };
  await prisma.orderAuthToken.update({ where: { id: rec.id }, data: { usedAt: new Date() as any } });
  log('mcp.order.validateToken.ok', { orderId });
  return { success: true, message: 'Token válido', data: null };
}
