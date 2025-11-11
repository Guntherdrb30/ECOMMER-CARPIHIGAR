import prisma from '@/lib/prisma';
import { emit } from '@/server/events/bus';

async function main() {
  const order = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!order) { console.log('No orders found'); return; }
  await prisma.order.update({ where: { id: order.id }, data: { status: 'PAGADO' as any } });
  await emit('order.paid', { orderId: order.id, customerId: order.userId });
  console.log('Emitted order.paid for', order.id);
}

main().catch((e) => { console.error(e); process.exit(1); });
