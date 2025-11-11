import { log } from '../../lib/logger';
import { ensureId, ensureQty } from '../../lib/validate';
import { prisma } from '../../lib/db';

export async function run(input: { sessionId?: string; customerId?: string; productId: string; quantity?: number }) {
  try {
    const productId = ensureId(input?.productId, 'productId');
    const qty = ensureQty(input?.quantity ?? 1);
    const ownerKey = (input?.customerId || input?.sessionId || '').trim();
    if (!ownerKey) return { success: false, message: 'Falta customerId o sessionId', data: null };
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, priceUSD: true, priceClientUSD: true } });
    if (!product) return { success: false, message: 'Producto no encontrado', data: null };
    let cart = await prisma.assistantCart.findFirst({ where: { ownerKey }, select: { id: true } });
    if (!cart) {
      cart = await prisma.assistantCart.create({ data: { ownerKey, userId: input?.customerId || null as any } as any, select: { id: true } });
    }
    const price = (product.priceClientUSD as any) ? Number(product.priceClientUSD) : Number(product.priceUSD as any);
    const existing = await prisma.assistantCartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (existing) {
      await prisma.assistantCartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + qty } });
    } else {
      await prisma.assistantCartItem.create({ data: { cartId: cart.id, productId, name: product.name, priceUSD: price as any, quantity: qty } });
    }
    log('mcp.cart.add', { ownerKey, productId, qty });
    return { success: true, message: 'Agregado al carrito', data: { productId, quantity: qty } };
  } catch (e: any) {
    return { success: false, message: String(e?.message || 'No se pudo agregar'), data: null };
  }
}
