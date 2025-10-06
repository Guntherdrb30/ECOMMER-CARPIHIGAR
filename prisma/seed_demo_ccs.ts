import { PrismaClient, Role, AlliedStatus, OrderStatus, SaleType, ShippingCarrier, ShippingChannel, ShippingStatus, CommissionStatus, PaymentMethod, PaymentStatus, Currency } from '@prisma/client';

const prisma = new PrismaClient();

type ItemSpec = { slug: string; qty: number };

function calcTotals(prices: number[], qtys: number[], ivaPercent = 16, tasaVES = 40) {
  const subtotalUSD = prices.reduce((a, p, i) => a + p * qtys[i], 0);
  const totalUSD = +(subtotalUSD * (1 + ivaPercent / 100)).toFixed(2);
  const totalVES = +(totalUSD * tasaVES).toFixed(2);
  return { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES };
}

async function ensureClient(email: string, name: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role: Role.CLIENTE, alliedStatus: AlliedStatus.NONE },
    create: { email, name, role: Role.CLIENTE, alliedStatus: AlliedStatus.NONE, password: '$2b$10$abcdefghijklmnopqrstuv' }, // dummy hash
  });
}

async function ensureAddress(id: string, userId: string, city: string, state: string, fullname: string) {
  return prisma.address.upsert({
    where: { id },
    update: { userId, fullname, phone: '+58 424-999-9999', state, city, zone: 'Centro', address1: 'Av. Demo 123', notes: 'Dirección de pruebas' },
    create: { id, userId, fullname, phone: '+58 424-999-9999', state, city, zone: 'Centro', address1: 'Av. Demo 123', notes: 'Dirección de pruebas' },
  });
}

async function getProductsBySlugs(slugs: string[]) {
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const map = new Map(products.map(p => [p.slug, p] as const));
  return slugs.map(s => map.get(s)!);
}

async function upsertOrderWithEverything(opts: {
  id: string;
  customerEmail: string;
  sellerEmail: string;
  addressId: string | null;
  items: ItemSpec[];
  status: OrderStatus;
  saleType: SaleType;
  createdAt?: Date;
  payment?: { method: PaymentMethod; status: PaymentStatus; currency?: Currency; reference?: string } | null;
  shipping: { carrier: ShippingCarrier; channel: ShippingChannel; status: ShippingStatus; tracking?: string | null; observations?: string | null };
  commissionPercent?: number;
}) {
  const customer = await prisma.user.findUnique({ where: { email: opts.customerEmail } });
  const seller = await prisma.user.findUnique({ where: { email: opts.sellerEmail } });
  if (!customer || !seller) throw new Error('Cliente o vendedor no encontrado');
  const prods = await getProductsBySlugs(opts.items.map(i => i.slug));
  const prices = prods.map((p) => Number(p.priceUSD));
  const qtys = opts.items.map(i => i.qty);
  const { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES } = calcTotals(prices, qtys);
  const itemsCreate = prods.map((p, idx) => ({ productId: p.id, name: p.name, priceUSD: prices[idx], quantity: qtys[idx] }));

  const order = await prisma.order.upsert({
    where: { id: opts.id },
    update: { userId: customer.id, sellerId: seller.id, shippingAddressId: opts.addressId, subtotalUSD, ivaPercent, tasaVES, totalUSD, totalVES, status: opts.status, saleType: opts.saleType, createdAt: (opts.createdAt ?? new Date()) as any, items: { deleteMany: {}, create: itemsCreate } },
    create: { id: opts.id, userId: customer.id, sellerId: seller.id, shippingAddressId: opts.addressId, subtotalUSD, ivaPercent, tasaVES, totalUSD, totalVES, status: opts.status, saleType: opts.saleType, createdAt: (opts.createdAt ?? new Date()) as any, items: { create: itemsCreate } },
  });

  if (opts.payment) {
    await prisma.payment.upsert({ where: { orderId: order.id }, update: { method: opts.payment.method, status: opts.payment.status, currency: opts.payment.currency ?? Currency.USD, reference: opts.payment.reference ?? null }, create: { orderId: order.id, method: opts.payment.method, status: opts.payment.status, currency: opts.payment.currency ?? Currency.USD, reference: opts.payment.reference ?? null } });
  }

  await prisma.shipping.upsert({ where: { orderId: order.id }, update: { carrier: opts.shipping.carrier, channel: opts.shipping.channel, status: opts.shipping.status, tracking: opts.shipping.tracking ?? null, observations: opts.shipping.observations ?? null }, create: { orderId: order.id, carrier: opts.shipping.carrier, channel: opts.shipping.channel, status: opts.shipping.status, tracking: opts.shipping.tracking ?? null, observations: opts.shipping.observations ?? null } });

  if (opts.commissionPercent && opts.commissionPercent > 0) {
    const amountUSD = +(Number(subtotalUSD) * (opts.commissionPercent / 100)).toFixed(2);
    await prisma.commission.upsert({ where: { orderId: order.id }, update: { sellerId: seller.id, percent: opts.commissionPercent as any, amountUSD: amountUSD as any, status: CommissionStatus.PENDIENTE }, create: { orderId: order.id, sellerId: seller.id, percent: opts.commissionPercent as any, amountUSD: amountUSD as any, status: CommissionStatus.PENDIENTE } });
  }

  return order.id;
}

async function main() {
  console.log('Seed clientes + comisiones + envíos ...');
  // Vendedores existentes del seed demo
  const vendedor1 = await prisma.user.findUnique({ where: { email: 'vendedor1@carpihogar.ai' } });
  const vendedor2 = await prisma.user.findUnique({ where: { email: 'vendedor2@carpihogar.ai' } });
  if (!vendedor1 || !vendedor2) throw new Error('Faltan vendedores demo. Ejecuta primero npm run seed:demo');

  // Nuevos clientes y direcciones
  const c3 = await ensureClient('cliente3@carpihogar.ai', 'Cliente Tres');
  const c4 = await ensureClient('cliente4@carpihogar.ai', 'Cliente Cuatro');
  await ensureAddress('addr_ccs_c3', c3.id, 'Maracaibo', 'Zulia', 'Cliente Tres');
  await ensureAddress('addr_ccs_c4', c4.id, 'Valencia', 'Carabobo', 'Cliente Cuatro');

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  // Órdenes para dashboards (fechas distribuidas)
  const o1 = await upsertOrderWithEverything({
    id: 'o_ccs_1', customerEmail: c3.email, sellerEmail: 'vendedor1@carpihogar.ai', addressId: 'addr_ccs_c3',
    items: [ { slug: 'gabinete-cocina-moderno', qty: 1 }, { slug: 'espejo-bano-led', qty: 1 } ],
    status: OrderStatus.ENVIADO, saleType: SaleType.CONTADO, createdAt: daysAgo(2),
    payment: { method: PaymentMethod.ZELLE, status: PaymentStatus.APROBADO, reference: 'ZL-CCS-01' },
    shipping: { carrier: ShippingCarrier.TEALCA, channel: ShippingChannel.ONLINE, status: ShippingStatus.EN_TRANSITO, tracking: 'T-CCS-01' },
    commissionPercent: 6,
  });

  const o2 = await upsertOrderWithEverything({
    id: 'o_ccs_2', customerEmail: c3.email, sellerEmail: 'vendedor2@carpihogar.ai', addressId: 'addr_ccs_c3',
    items: [ { slug: 'organizador-closet-modular', qty: 1 } ],
    status: OrderStatus.PAGADO, saleType: SaleType.CONTADO, createdAt: daysAgo(10),
    payment: { method: PaymentMethod.PAGO_MOVIL, status: PaymentStatus.APROBADO, reference: 'PM-CCS-02' },
    shipping: { carrier: ShippingCarrier.DELIVERY, channel: ShippingChannel.ONLINE, status: ShippingStatus.DESPACHADO, tracking: 'DL-CCS-02' },
    commissionPercent: 5,
  });

  const o3 = await upsertOrderWithEverything({
    id: 'o_ccs_3', customerEmail: c4.email, sellerEmail: 'vendedor1@carpihogar.ai', addressId: 'addr_ccs_c4',
    items: [ { slug: 'lampara-techo-decorativa', qty: 2 } ],
    status: OrderStatus.CONFIRMACION, saleType: SaleType.CONTADO, createdAt: daysAgo(20),
    payment: { method: PaymentMethod.TRANSFERENCIA, status: PaymentStatus.EN_REVISION, reference: 'TR-CCS-03' },
    shipping: { carrier: ShippingCarrier.FLETE_PRIVADO, channel: ShippingChannel.TIENDA, status: ShippingStatus.PREPARANDO },
    commissionPercent: 7,
  });

  const o4 = await upsertOrderWithEverything({
    id: 'o_ccs_4', customerEmail: c4.email, sellerEmail: 'vendedor2@carpihogar.ai', addressId: null,
    items: [ { slug: 'set-cojines-decorativos', qty: 5 } ],
    status: OrderStatus.PENDIENTE, saleType: SaleType.CONTADO, createdAt: daysAgo(30),
    payment: { method: PaymentMethod.PAGO_MOVIL, status: PaymentStatus.EN_REVISION, reference: 'PM-CCS-04' },
    shipping: { carrier: ShippingCarrier.RETIRO_TIENDA, channel: ShippingChannel.TIENDA, status: ShippingStatus.PREPARANDO },
    commissionPercent: 5,
  });

  const o5 = await upsertOrderWithEverything({
    id: 'o_ccs_5', customerEmail: c3.email, sellerEmail: 'vendedor1@carpihogar.ai', addressId: 'addr_ccs_c3',
    items: [ { slug: 'mueble-lavamanos', qty: 1 }, { slug: 'espejo-bano-led', qty: 1 } ],
    status: OrderStatus.COMPLETADO, saleType: SaleType.CONTADO, createdAt: daysAgo(40),
    payment: { method: PaymentMethod.ZELLE, status: PaymentStatus.APROBADO, reference: 'ZL-CCS-05' },
    shipping: { carrier: ShippingCarrier.MRW, channel: ShippingChannel.ONLINE, status: ShippingStatus.ENTREGADO, tracking: 'MRW-CCS-05' },
    commissionPercent: 6,
  });

  const o6 = await upsertOrderWithEverything({
    id: 'o_ccs_6', customerEmail: c4.email, sellerEmail: 'vendedor2@carpihogar.ai', addressId: 'addr_ccs_c4',
    items: [ { slug: 'closet-6-puertas', qty: 1 } ],
    status: OrderStatus.CANCELADO, saleType: SaleType.CONTADO, createdAt: daysAgo(5),
    payment: { method: PaymentMethod.TRANSFERENCIA, status: PaymentStatus.RECHAZADO, reference: 'TR-CCS-06' },
    shipping: { carrier: ShippingCarrier.OTRO, channel: ShippingChannel.ONLINE, status: ShippingStatus.INCIDENCIA, observations: 'Cancelado por cliente' },
    commissionPercent: 4,
  });

  // Marcar algunas comisiones como pagadas para probar KPIs y filtros
  await prisma.commission.updateMany({ where: { orderId: { in: [o1, o5] } }, data: { status: CommissionStatus.PAGADA } });

  console.log('Seed clientes + comisiones + envíos completado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

