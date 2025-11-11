import prisma from '@/lib/prisma';
import * as CartView from '@/agents/carpihogar-ai-actions/tools/cart/viewCart';

export async function handleCreateTempOrder({ customerId, sessionId, shippingData }: { customerId?: string; sessionId?: string; shippingData?: any }) {
  const cart = await CartView.run({ customerId, sessionId });
  const items = cart?.data?.items || [];
  const totalUSD = Number(cart?.data?.totals?.totalUSD || 0);
  if (!items.length) return { ok: false, messages: [{ role: 'assistant', type: 'text', content: 'Tu carrito está vacío.' }] } as any;
  const temp = await prisma.ordersTemp.create({ data: { customerId: customerId || '', items: items as any, totalUSD: totalUSD as any, shippingData: shippingData as any } });
  return { ok: true, orderTempId: temp.id, messages: [{ role: 'assistant', type: 'text', content: `Orden temporal creada. Total $${totalUSD.toFixed(2)}` }] } as any;
}
