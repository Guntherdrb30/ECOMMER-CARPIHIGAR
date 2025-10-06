import { PrismaClient, OrderStatus, SaleType, ShippingCarrier, ShippingChannel, ShippingStatus, CommissionStatus, PaymentStatus, PaymentMethod, Currency } from '@prisma/client';

const prisma = new PrismaClient();

type ItemSpec = { productSlug: string; qty: number };

function calcTotals(prices: number[], qtys: number[], ivaPercent = 16, tasaVES = 40) {
  const subtotalUSD = prices.reduce((acc, p, i) => acc + p * qtys[i], 0);
  const totalUSD = +(subtotalUSD * (1 + ivaPercent / 100)).toFixed(2);
  const totalVES = +(totalUSD * tasaVES).toFixed(2);
  return { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES };
}

async function upsertAddress(id: string, userId: string) {
  return prisma.address.upsert({
    where: { id },
    update: {
      fullname: 'Cliente Demo',
      phone: '+58 424-000-0000',
      state: 'Distrito Capital',
      city: 'Caracas',
      zone: 'Chacao',
      address1: 'Av. Principal, Torre Demo',
      notes: 'Dirección de pruebas',
      userId,
    },
    create: {
      id,
      userId,
      fullname: 'Cliente Demo',
      phone: '+58 424-000-0000',
      state: 'Distrito Capital',
      city: 'Caracas',
      zone: 'Chacao',
      address1: 'Av. Principal, Torre Demo',
      notes: 'Dirección de pruebas',
    },
  });
}

async function getProductsBySlugs(slugs: string[]) {
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug[s]).filter(Boolean);
}

async function upsertOrderWithItems(opts: {
  id: string;
  customerId: string;
  sellerId?: string | null;
  shippingAddressId?: string | null;
  items: ItemSpec[];
  status?: OrderStatus;
  saleType?: SaleType;
  creditDueDate?: Date | null;
}) {
  const products = await getProductsBySlugs(opts.items.map((i) => i.productSlug));
  if (products.length !== opts.items.length) {
    throw new Error('No se encontraron todos los productos por slug');
  }
  const prices = products.map((p) => Number(p.priceUSD));
  const qtys = opts.items.map((i) => i.qty);
  const { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES } = calcTotals(prices, qtys);

  const itemCreates = products.map((p, idx) => ({
    productId: p.id,
    name: p.name,
    priceUSD: Number(p.priceUSD),
    quantity: qtys[idx],
  }));

  return prisma.order.upsert({
    where: { id: opts.id },
    update: {
      userId: opts.customerId,
      sellerId: opts.sellerId ?? null,
      subtotalUSD,
      ivaPercent,
      tasaVES,
      totalUSD,
      totalVES,
      status: opts.status ?? OrderStatus.PENDIENTE,
      saleType: opts.saleType ?? SaleType.CONTADO,
      creditDueDate: opts.creditDueDate ?? null,
      shippingAddressId: opts.shippingAddressId ?? null,
      items: { deleteMany: {}, create: itemCreates },
    },
    create: {
      id: opts.id,
      userId: opts.customerId,
      sellerId: opts.sellerId ?? null,
      subtotalUSD,
      ivaPercent,
      tasaVES,
      totalUSD,
      totalVES,
      status: opts.status ?? OrderStatus.PENDIENTE,
      saleType: opts.saleType ?? SaleType.CONTADO,
      creditDueDate: opts.creditDueDate ?? null,
      shippingAddressId: opts.shippingAddressId ?? null,
      items: { create: itemCreates },
    },
    include: { items: true },
  });
}

async function upsertPayment(orderId: string) {
  return prisma.payment.upsert({
    where: { orderId },
    update: {
      method: PaymentMethod.ZELLE,
      reference: 'ZL-0001',
      status: PaymentStatus.APROBADO,
      currency: Currency.USD,
    },
    create: {
      orderId,
      method: PaymentMethod.ZELLE,
      reference: 'ZL-0001',
      status: PaymentStatus.APROBADO,
      currency: Currency.USD,
    },
  });
}

async function upsertShipping(orderId: string, data: {
  carrier: ShippingCarrier;
  tracking?: string | null;
  status?: ShippingStatus;
  channel?: ShippingChannel;
  observations?: string | null;
}) {
  return prisma.shipping.upsert({
    where: { orderId },
    update: {
      carrier: data.carrier,
      tracking: data.tracking ?? null,
      status: data.status ?? ShippingStatus.PENDIENTE,
      channel: data.channel ?? ShippingChannel.TIENDA,
      observations: data.observations ?? null,
    },
    create: {
      orderId,
      carrier: data.carrier,
      tracking: data.tracking ?? null,
      status: data.status ?? ShippingStatus.PENDIENTE,
      channel: data.channel ?? ShippingChannel.TIENDA,
      observations: data.observations ?? null,
    },
  });
}

async function upsertCommission(orderId: string, sellerId: string, percent = 5) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Orden no encontrada para comisión');
  const amountUSD = +(Number(order.subtotalUSD) * (percent / 100)).toFixed(2);
  return prisma.commission.upsert({
    where: { orderId },
    update: { sellerId, percent, amountUSD, status: CommissionStatus.PENDIENTE },
    create: { orderId, sellerId, percent, amountUSD, status: CommissionStatus.PENDIENTE },
  });
}

async function upsertReceivable(orderId: string, opts: { dueInDays: number; partialUSD?: number }) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + opts.dueInDays);
  const receivable = await prisma.receivable.upsert({
    where: { orderId },
    update: { status: opts.partialUSD ? 'PARCIAL' : 'PENDIENTE', dueDate },
    create: { orderId, status: opts.partialUSD ? 'PARCIAL' : 'PENDIENTE', dueDate },
  });
  if (opts.partialUSD) {
    await prisma.receivableEntry.upsert({
      where: { id: 're_seed_1' },
      update: {
        receivableId: receivable.id,
        amountUSD: opts.partialUSD,
        currency: Currency.USD,
        method: PaymentMethod.TRANSFERENCIA,
        reference: 'TR-0001',
      },
      create: {
        id: 're_seed_1',
        receivableId: receivable.id,
        amountUSD: opts.partialUSD,
        currency: Currency.USD,
        method: PaymentMethod.TRANSFERENCIA,
        reference: 'TR-0001',
      },
    });
  }
  return receivable;
}

async function main() {
  console.log('Seeding ventas/órdenes/envíos ...');

  const customer = await prisma.user.findUnique({ where: { email: 'cliente@carpihogar.ai' } });
  const seller = await prisma.user.findUnique({ where: { email: 'root@carpihogar.ai' } });
  if (!customer || !seller) {
    throw new Error('Usuarios base no encontrados. Ejecuta primero npm run seed');
  }

  const addr = await upsertAddress('addr_seed_1', customer.id);

  // Orden 1: contado, pago aprobado, enviado y entregado
  const o1 = await upsertOrderWithItems({
    id: 'o_seed_1',
    customerId: customer.id,
    sellerId: seller.id,
    shippingAddressId: addr.id,
    items: [
      { productSlug: 'gabinete-cocina-moderno', qty: 1 },
      { productSlug: 'espejo-bano-led', qty: 2 },
    ],
    status: OrderStatus.COMPLETADO,
    saleType: SaleType.CONTADO,
  });
  await upsertPayment(o1.id);
  await upsertCommission(o1.id, seller.id, 5);
  await upsertShipping(o1.id, {
    carrier: ShippingCarrier.TEALCA,
    tracking: 'T-0001',
    status: ShippingStatus.ENTREGADO,
    channel: ShippingChannel.ONLINE,
    observations: 'Entregado sin novedades',
  });

  // Orden 2: crédito, con cuenta por cobrar parcial y envío en tránsito
  const o2 = await upsertOrderWithItems({
    id: 'o_seed_2',
    customerId: customer.id,
    sellerId: seller.id,
    shippingAddressId: addr.id,
    items: [
      { productSlug: 'closet-6-puertas', qty: 1 },
      { productSlug: 'mueble-lavamanos', qty: 1 },
    ],
    status: OrderStatus.ENVIADO,
    saleType: SaleType.CREDITO,
    creditDueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
  });
  await upsertCommission(o2.id, seller.id, 5);
  await upsertShipping(o2.id, {
    carrier: ShippingCarrier.MRW,
    tracking: 'M-0002',
    status: ShippingStatus.EN_TRANSITO,
    channel: ShippingChannel.ONLINE,
    observations: 'En ruta de entrega',
  });
  await upsertReceivable(o2.id, { dueInDays: 15, partialUSD: 100 });

  // Orden 3: pendiente, retiro en tienda
  const o3 = await upsertOrderWithItems({
    id: 'o_seed_3',
    customerId: customer.id,
    sellerId: seller.id,
    shippingAddressId: null,
    items: [
      { productSlug: 'set-cojines-decorativos', qty: 3 },
    ],
    status: OrderStatus.PENDIENTE,
    saleType: SaleType.CONTADO,
  });
  await upsertShipping(o3.id, {
    carrier: ShippingCarrier.RETIRO_TIENDA,
    tracking: null,
    status: ShippingStatus.PREPARANDO,
    channel: ShippingChannel.TIENDA,
    observations: 'Cliente retirará en mostrador',
  });

  console.log('Seeding de ventas/envíos completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

