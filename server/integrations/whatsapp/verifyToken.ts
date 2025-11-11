import prisma from '@/lib/prisma';
import { emit } from '@/server/events/bus';

export async function verifyToken(customerId: string, token: string) {
  const rec = await prisma.purchaseToken.findFirst({ where: { customerId, token, used: false } });
  if (!rec) return { ok: false };
  if (rec.expiresAt && rec.expiresAt < (new Date() as any)) return { ok: false };
  await prisma.purchaseToken.update({ where: { id: rec.id }, data: { used: true } });
  // Create order from temp
  const temp = await prisma.ordersTemp.findUnique({ where: { id: rec.orderTempId } });
  if (!temp) return { ok: false };
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const ivaPercent = Number(settings?.ivaPercent || 16);
  const tasaVES = Number(settings?.tasaVES || 40);
  const items: Array<{ productId: string; name: string; priceUSD: number; quantity: number }> = Array.isArray((temp as any).items) ? (temp as any).items : [];
  const subtotalUSD = items.reduce((s, it) => s + (Number(it.priceUSD) * Number(it.quantity)), 0);
  const totalUSD = subtotalUSD * (1 + ivaPercent/100);
  const totalVES = totalUSD * tasaVES;
  const order = await prisma.order.create({ data: {
    userId: temp.customerId,
    subtotalUSD: subtotalUSD as any,
    ivaPercent: ivaPercent as any,
    tasaVES: tasaVES as any,
    totalUSD: totalUSD as any,
    totalVES: totalVES as any,
    status: 'PENDIENTE' as any,
    saleType: 'CONTADO' as any,
    items: { create: items.map((it) => ({ productId: it.productId, name: it.name || '', priceUSD: it.priceUSD as any, quantity: it.quantity })) },
  }, include: { items: true } });
  try { await emit('order.confirmed' as any, { orderId: order.id, customerId }); } catch {}
  return { ok: true, orderId: order.id };
}
