import prisma from '@/lib/prisma';
import { shippingMsg } from './messages';
import { sendWhatsAppText } from '@/lib/whatsapp';

export async function notifyShipmentCreated({ customerId, orderId, provider, trackingCode }: { customerId?: string; orderId: string; provider: string; trackingCode?: string }) {
  if (!customerId) return;
  const user = await prisma.user.findUnique({ where: { id: customerId } });
  const phone = (user as any)?.phone || '';
  if (!phone) return;
  const body = shippingMsg.created(provider, trackingCode);
  await sendWhatsAppText(phone, body).catch(() => ({ ok: false }));
}

export async function notifyShipmentStatus({ customerId, status, eta }: { customerId?: string; status: string; eta?: string }) {
  if (!customerId) return;
  const user = await prisma.user.findUnique({ where: { id: customerId } });
  const phone = (user as any)?.phone || '';
  if (!phone) return;
  let body = '';
  if (status === 'PREPARANDO') body = shippingMsg.created('DELIVERY');
  if (status === 'DESPACHADO') body = shippingMsg.assigned;
  if (status === 'EN_TRANSITO') body = shippingMsg.in_route(eta);
  if (status === 'ENTREGADO') body = shippingMsg.delivered;
  if (status === 'INCIDENCIA') body = shippingMsg.incident;
  if (!body) return;
  await sendWhatsAppText(phone, body).catch(() => ({ ok: false }));
}
