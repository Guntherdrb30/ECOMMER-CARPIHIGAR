import { prisma } from '../../lib/db';
import { log } from '../../lib/logger';

type Item = { productId: string; name?: string; priceUSD: number; quantity: number };

export async function run(input: { userId: string; items: Item[]; shippingAddressId?: string }) {
  try {
    const userId = String(input?.userId || '').trim();
    if (!userId) return { success: false, message: 'userId requerido', data: null };
    const items = Array.isArray(input?.items) ? input!.items : [];
    if (!items.length) return { success: false, message: 'items requerido', data: null };
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const ivaPercent = Number(settings?.ivaPercent || 16);
    const tasaVES = Number(settings?.tasaVES || 40);
    const subtotalUSD = items.reduce((s, it) => s + (Number(it.priceUSD) * Number(it.quantity)), 0);
    const totalUSD = subtotalUSD * (1 + ivaPercent/100);
    const totalVES = totalUSD * tasaVES;
    const order = await prisma.order.create({ data: {
      userId,
      sellerId: null,
      subtotalUSD: subtotalUSD as any,
      ivaPercent: ivaPercent as any,
      tasaVES: tasaVES as any,
      totalUSD: totalUSD as any,
      totalVES: totalVES as any,
      status: 'PENDIENTE' as any,
      saleType: 'CONTADO' as any,
      shippingAddressId: input?.shippingAddressId || null,
      items: { create: items.map((it) => ({ productId: it.productId, name: it.name || '', priceUSD: it.priceUSD as any, quantity: it.quantity })) },
    }, include: { items: true } });
    log('mcp.order.create', { orderId: order.id, items: order.items.length });
    return { success: true, message: 'Orden creada', data: { id: order.id, totals: { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES } } };
  } catch (e: any) {
    log('mcp.order.create.error', { error: String(e?.message || e) }, 'error');
    return { success: false, message: 'No se pudo crear la orden', data: null };
  }
}

