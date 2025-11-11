import { log } from '../../lib/logger';
import { ensureId, ensureQty } from '../../lib/validate';
import { prisma } from '../../lib/db';

export async function run(input: { sessionId?: string; customerId?: string; productId: string; quantity: number }) {
  try {
    const productId = ensureId(input?.productId, 'productId');
    const qty = ensureQty(input?.quantity);
    const ownerKey = (input?.customerId || input?.sessionId || '').trim();
    if (!ownerKey) return { success: false, message: 'Falta customerId o sessionId', data: null };
    const cart = await prisma.assistantCart.findFirst({ where: { ownerKey }, select: { id: true } });
    if (!cart) return { success: false, message: 'Carrito no encontrado', data: null };
    if (qty <= 0) {
      await prisma.assistantCartItem.deleteMany({ where: { cartId: cart.id, productId } });
    } else {
      const item = await prisma.assistantCartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
      if (!item) return { success: false, message: 'Producto no está en el carrito', data: null };
      await prisma.assistantCartItem.update({ where: { id: item.id }, data: { quantity: qty } });
    }
    log('mcp.cart.updateQty', { ownerKey, productId, qty });
    return { success: true, message: 'Cantidad actualizada', data: { productId, quantity: qty } };
  } catch (e: any) {
    return { success: false, message: String(e?.message || 'No se pudo actualizar'), data: null };
  }
}
