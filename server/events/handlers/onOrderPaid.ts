import prisma from '@/lib/prisma';
import { emit } from '../bus';
import { selectProvider } from '@/server/shipping/providerSelector';

export async function onOrderPaid({ orderId, customerId }: { orderId: string; customerId?: string }) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shipping: true, user: true, shippingAddress: true } });
  if (!order) return;
  // If shipping exists, keep it, just ensure status moves forward
  if (!order.shipping) {
    const city = String(order.shippingAddress?.city || '');
    const provider = selectProvider({ city });
    const carrierMap: any = { mrw: 'MRW', tealca: 'TEALCA', interno: 'DELIVERY' };
    const carrier = carrierMap[provider] || 'DELIVERY';
    const created = await prisma.shipping.create({ data: { orderId: order.id, carrier: carrier as any, channel: 'ONLINE' as any, status: 'PREPARANDO' as any, tracking: null, observations: null } });
    await emit('shipment.created', { shipmentId: created.id, orderId: order.id, customerId });
  } else {
    // Move to PREPARANDO if pending
    if ((order.shipping as any).status === 'PENDIENTE') {
      await prisma.shipping.update({ where: { orderId: order.id }, data: { status: 'PREPARANDO' as any } });
      await emit('shipment.status.changed', { shipmentId: order.shipping.id, status: 'PREPARANDO', orderId: order.id, customerId });
    }
  }
}
