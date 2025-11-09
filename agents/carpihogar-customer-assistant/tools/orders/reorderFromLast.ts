import prisma from '@/lib/prisma';
import { addToCart } from '../cart/addToCart';
import { searchProducts } from '../products/searchProducts';

export async function reorderFromLast(input: { customerId?: string; terms?: string; qty?: number }) {
  const externalId = input.customerId;
  const qty = Math.max(1, Number(input.qty || 1));
  if (input.terms) {
    const prods = await searchProducts(input.terms);
    const p = prods[0];
    if (p) {
      await addToCart({ customerId: externalId, productId: p.id, qty });
      return { ok: true, added: [{ productId: p.id, qty }] };
    }
    return { ok: false, error: 'No encontré ese producto en tu catálogo.' };
  }
  // Buscar último pedido del ecommerce principal
  if (!externalId) return { ok: false, error: 'Necesito identificarte para reordenar.' };
  const order = await prisma.order.findFirst({
    where: { userId: externalId },
    orderBy: { createdAt: 'desc' },
    select: { items: { select: { productId: true, quantity: true } } },
  });
  if (!order || !order.items?.length) return { ok: false, error: 'No encontré compras anteriores.' };
  const added: Array<{ productId: string; qty: number }> = [];
  for (const it of order.items) {
    await addToCart({ customerId: externalId, productId: it.productId as any, qty: it.quantity as any });
    added.push({ productId: it.productId as any, qty: it.quantity as any });
  }
  return { ok: true, added };
}

