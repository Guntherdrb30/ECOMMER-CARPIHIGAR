import { PrismaClient, OrderStatus, SaleType, ShippingCarrier, ShippingChannel, ShippingStatus, PaymentMethod, PaymentStatus, Currency, POStatus, CommissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function getProductsBySlugs(slugs: string[]) {
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const bySlug = new Map(products.map(p => [p.slug, p] as const));
  return slugs.map(s => bySlug.get(s));
}

function calcTotals(prices: number[], qtys: number[], ivaPercent = 16, tasaVES = 40) {
  const subtotalUSD = prices.reduce((acc, p, i) => acc + p * qtys[i], 0);
  const totalUSD = +(subtotalUSD * (1 + ivaPercent / 100)).toFixed(2);
  const totalVES = +(totalUSD * tasaVES).toFixed(2);
  return { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES };
}

async function upsertOrder(opts: { id: string; customerEmail: string; sellerEmail?: string; addressId?: string | null; items: Array<{ slug: string; qty: number }>; status: OrderStatus; saleType: SaleType; creditDueDate?: Date | null; }) {
  const customer = await prisma.user.findUnique({ where: { email: opts.customerEmail } });
  if (!customer) throw new Error('Cliente no encontrado: ' + opts.customerEmail);
  const seller = opts.sellerEmail ? await prisma.user.findUnique({ where: { email: opts.sellerEmail } }) : null;
  const prods = await getProductsBySlugs(opts.items.map(i => i.slug));
  if (prods.some(p => !p)) throw new Error('Productos faltantes para orden ' + opts.id);
  const prices = prods.map((p, i) => Number(p!.priceUSD));
  const qtys = opts.items.map(i => i.qty);
  const { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES } = calcTotals(prices, qtys);
  const itemsCreate = prods.map((p, idx) => ({ productId: p!.id, name: p!.name, priceUSD: prices[idx], quantity: qtys[idx] }));
  return prisma.order.upsert({
    where: { id: opts.id },
    update: { userId: customer.id, sellerId: seller?.id ?? null, shippingAddressId: opts.addressId ?? null, subtotalUSD, ivaPercent, tasaVES, totalUSD, totalVES, status: opts.status, saleType: opts.saleType, creditDueDate: opts.creditDueDate ?? null, items: { deleteMany: {}, create: itemsCreate } },
    create: { id: opts.id, userId: customer.id, sellerId: seller?.id ?? null, shippingAddressId: opts.addressId ?? null, subtotalUSD, ivaPercent, tasaVES, totalUSD, totalVES, status: opts.status, saleType: opts.saleType, creditDueDate: opts.creditDueDate ?? null, items: { create: itemsCreate } },
  });
}

async function main() {
  console.log('Seed DEMO extra: ampliando escenarios...');

  // 1) Marcar algunas comisiones como PAGADA
  await prisma.commission.updateMany({ where: { orderId: { in: ['o_seed_1', 'o_demo_5'] } }, data: { status: CommissionStatus.PAGADA } });

  // 2) Orden de crédito cancelada con receivable cancelado e incidencia en envío
  const o9 = await upsertOrder({
    id: 'o_demo_9',
    customerEmail: 'cliente2@carpihogar.ai',
    sellerEmail: 'vendedor2@carpihogar.ai',
    addressId: 'addr_demo_c2',
    items: [ { slug: 'mueble-lavamanos', qty: 1 } ],
    status: OrderStatus.CANCELADO,
    saleType: SaleType.CREDITO,
    creditDueDate: new Date(Date.now() + 1000*60*60*24*30),
  });
  await prisma.receivable.upsert({ where: { orderId: o9.id }, update: { status: 'CANCELADO' as any, dueDate: new Date(Date.now() + 1000*60*60*24*30) as any }, create: { orderId: o9.id, status: 'CANCELADO' as any, dueDate: new Date(Date.now() + 1000*60*60*24*30) as any } });
  await prisma.shipping.upsert({ where: { orderId: o9.id }, update: { carrier: ShippingCarrier.MRW, channel: ShippingChannel.ONLINE, status: ShippingStatus.INCIDENCIA, tracking: 'MRW-ERR-09', observations: 'Incidencia y cancelación por cliente' }, create: { orderId: o9.id, carrier: ShippingCarrier.MRW, channel: ShippingChannel.ONLINE, status: ShippingStatus.INCIDENCIA, tracking: 'MRW-ERR-09', observations: 'Incidencia y cancelación por cliente' } });

  // 3) Crear PO cancelada para cubrir estado CANCELLED
  const p = await prisma.product.findFirst({ where: { slug: 'set-cojines-decorativos' } });
  if (p) {
    await prisma.purchaseOrder.upsert({
      where: { id: 'po_demo_3' },
      update: { supplierId: (await prisma.supplier.findFirst())?.id || 'sup_demo_1', status: POStatus.CANCELLED, totalUSD: 0 as any, items: { deleteMany: {}, create: [{ productId: p.id, quantity: 5, costUSD: 10 as any }] } },
      create: { id: 'po_demo_3', supplierId: (await prisma.supplier.findFirst())?.id || 'sup_demo_1', status: POStatus.CANCELLED, totalUSD: 50 as any, items: { create: [{ productId: p.id, quantity: 5, costUSD: 10 as any }] } },
    });
  }

  // 4) Agregar pago en revisión a una orden pendiente
  await prisma.payment.upsert({ where: { orderId: 'o_seed_3' }, update: { method: PaymentMethod.PAGO_MOVIL, status: PaymentStatus.EN_REVISION, currency: Currency.USD, reference: 'PM-REVIEW-03' }, create: { orderId: 'o_seed_3', method: PaymentMethod.PAGO_MOVIL, status: PaymentStatus.EN_REVISION, currency: Currency.USD, reference: 'PM-REVIEW-03' } });

  console.log('Seed DEMO extra completado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

