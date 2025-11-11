import prisma from '@/lib/prisma';

async function main() {
  // Create a dummy driver if none
  let driver = await prisma.user.findFirst({ where: { role: 'DELIVERY' as any } });
  if (!driver) {
    driver = await prisma.user.create({ data: { email: `driver_${Date.now()}@local`, password: '', role: 'DELIVERY' as any } });
  }
  const order = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!order) { console.log('No order found'); return; }
  // Assign shipping to driver
  let shipping = await prisma.shipping.findUnique({ where: { orderId: order.id } });
  if (!shipping) {
    shipping = await prisma.shipping.create({ data: { orderId: order.id, carrier: 'DELIVERY' as any, channel: 'TIENDA' as any, status: 'PENDIENTE' as any } });
  }
  await prisma.shipping.update({ where: { id: shipping.id }, data: { assignedToId: driver.id } });
  console.log('Assigned shipment', shipping.id, 'to driver', driver.id);
}

main().catch((e) => { console.error(e); process.exit(1); });

