import { log } from '../../lib/logger';
import { prisma } from '../../lib/db';

export async function run(input: { sessionId?: string; customerId?: string }) {
  const ownerKey = (input?.customerId || input?.sessionId || '').trim();
  if (!ownerKey) return { success: false, message: 'Falta customerId o sessionId', data: null };
  log('mcp.cart.view', { ownerKey });
  const cart = await prisma.assistantCart.findFirst({ where: { ownerKey }, select: { id: true } });
  if (!cart) return { success: true, message: 'OK', data: { items: [], totals: { subtotalUSD: 0, totalUSD: 0, ivaPercent: Number((await prisma.siteSettings.findUnique({ where: { id: 1 } }))?.ivaPercent || 16) } } };
  const items = await prisma.assistantCartItem.findMany({ where: { cartId: cart.id }, select: { productId: true, name: true, priceUSD: true, quantity: true } });
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const ivaPercent = Number(settings?.ivaPercent || 16);
  const tasaVES = Number(settings?.tasaVES || 40);
  const mapped = items.map((i) => ({ productId: i.productId, name: i.name, priceUSD: Number(i.priceUSD as any), quantity: i.quantity }));
  const subtotalUSD = mapped.reduce((s, it) => s + (Number(it.priceUSD) * Number(it.quantity)), 0);
  const totalUSD = subtotalUSD * (1 + ivaPercent/100);
  const totalVES = totalUSD * tasaVES;
  return { success: true, message: 'OK', data: { items: mapped, totals: { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES } } };
}
