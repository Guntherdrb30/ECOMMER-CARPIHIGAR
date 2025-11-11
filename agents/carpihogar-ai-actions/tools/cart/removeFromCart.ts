import { log } from '../../lib/logger';
import { ensureId } from '../../lib/validate';
import { prisma } from '../../lib/db';

export async function run(input: { sessionId?: string; customerId?: string; productId: string }) {
  try {
    const productId = ensureId(input?.productId, 'productId');
    const ownerKey = (input?.customerId || input?.sessionId || '').trim();
    if (!ownerKey) return { success: false, message: 'Falta customerId o sessionId', data: null };
    const cart = await prisma.assistantCart.findFirst({ where: { ownerKey }, select: { id: true } });
    if (!cart) return { success: true, message: 'Carrito vacío', data: null };
    await prisma.assistantCartItem.deleteMany({ where: { cartId: cart.id, productId } });
    log('mcp.cart.remove', { ownerKey, productId });
    return { success: true, message: 'Eliminado del carrito', data: { productId } };
  } catch (e: any) {
    return { success: false, message: String(e?.message || 'No se pudo eliminar'), data: null };
  }
}
