import { PrismaClient, Role, AlliedStatus, OrderStatus, SaleType, ShippingCarrier, ShippingChannel, ShippingStatus, CommissionStatus, PaymentStatus, PaymentMethod, Currency, POStatus, CostMethod, StockMoveType, QuoteStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type ItemSpec = { productSlug: string; qty: number; priceUSD?: number };

async function ensureUser(email: string, role: Role, name: string, alliedStatus: AlliedStatus = AlliedStatus.NONE) {
  const hash = await bcrypt.hash('Demo123!', 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, alliedStatus, password: hash },
    create: { email, name, role, alliedStatus, password: hash },
  });
}

async function ensureSuppliers() {
  const s1 = await prisma.supplier.upsert({
    where: { id: 'sup_demo_1' },
    update: { name: 'Maderas XYZ', email: 'contacto@maderasxyz.com' },
    create: { id: 'sup_demo_1', name: 'Maderas XYZ', email: 'contacto@maderasxyz.com' },
  });
  const s2 = await prisma.supplier.upsert({
    where: { id: 'sup_demo_2' },
    update: { name: 'ElectroLuz C.A.', email: 'ventas@electroluz.com' },
    create: { id: 'sup_demo_2', name: 'ElectroLuz C.A.', email: 'ventas@electroluz.com' },
  });
  return { s1, s2 };
}

async function getProducts(slugs: string[]) {
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const map = new Map(products.map(p => [p.slug, p] as const));
  return slugs.map(s => map.get(s)).filter(Boolean) as typeof products;
}

function calcTotals(prices: number[], qtys: number[], ivaPercent = 16, tasaVES = 40) {
  const subtotalUSD = prices.reduce((a, p, i) => a + p * qtys[i], 0);
  const totalUSD = +(subtotalUSD * (1 + ivaPercent / 100)).toFixed(2);
  const totalVES = +(totalUSD * tasaVES).toFixed(2);
  return { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES };
}

async function upsertOrder(opts: {
  id: string; customerId: string; sellerId?: string | null; addressId?: string | null; items: ItemSpec[];
  status: OrderStatus; saleType: SaleType; creditDueDate?: Date | null; payment?: { method: PaymentMethod; status: PaymentStatus; currency?: Currency; reference?: string } | null;
}) {
  const prods = await getProducts(opts.items.map(i => i.productSlug));
  if (prods.length !== opts.items.length) throw new Error('Productos faltantes para la orden ' + opts.id);
  const prices = prods.map((p, idx) => opts.items[idx].priceUSD ?? Number(p.priceUSD));
  const qtys = opts.items.map(i => i.qty);
  const { subtotalUSD, totalUSD, totalVES, ivaPercent, tasaVES } = calcTotals(prices, qtys);
  const itemCreates = prods.map((p, idx) => ({ productId: p.id, name: p.name, priceUSD: prices[idx], quantity: qtys[idx] }));

  const order = await prisma.order.upsert({
    where: { id: opts.id },
    update: {
      userId: opts.customerId, sellerId: opts.sellerId ?? null, shippingAddressId: opts.addressId ?? null,
      subtotalUSD, ivaPercent, tasaVES, totalUSD, totalVES, status: opts.status, saleType: opts.saleType, creditDueDate: opts.creditDueDate ?? null,
      items: { deleteMany: {}, create: itemCreates },
    },
    create: {
      id: opts.id, userId: opts.customerId, sellerId: opts.sellerId ?? null, shippingAddressId: opts.addressId ?? null,
      subtotalUSD, ivaPercent, tasaVES, totalUSD, totalVES, status: opts.status, saleType: opts.saleType, creditDueDate: opts.creditDueDate ?? null,
      items: { create: itemCreates },
    },
    include: { items: true },
  });

  if (opts.payment) {
    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { method: opts.payment.method, status: opts.payment.status, currency: opts.payment.currency ?? Currency.USD, reference: opts.payment.reference ?? null },
      create: { orderId: order.id, method: opts.payment.method, status: opts.payment.status, currency: opts.payment.currency ?? Currency.USD, reference: opts.payment.reference ?? null },
    });
  }

  return order;
}

async function upsertShipping(orderId: string, data: { carrier: ShippingCarrier; channel: ShippingChannel; status: ShippingStatus; tracking?: string | null; observations?: string | null; }) {
  return prisma.shipping.upsert({
    where: { orderId },
    update: { carrier: data.carrier, channel: data.channel, status: data.status, tracking: data.tracking ?? null, observations: data.observations ?? null },
    create: { orderId, carrier: data.carrier, channel: data.channel, status: data.status, tracking: data.tracking ?? null, observations: data.observations ?? null },
  });
}

async function upsertCommission(orderId: string, sellerId: string, percent = 5) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Orden no encontrada: ' + orderId);
  const amountUSD = +(Number(order.subtotalUSD) * (percent / 100)).toFixed(2);
  return prisma.commission.upsert({ where: { orderId }, update: { sellerId, percent, amountUSD, status: CommissionStatus.PENDIENTE }, create: { orderId, sellerId, percent, amountUSD, status: CommissionStatus.PENDIENTE } });
}

async function upsertReceivable(orderId: string, status: 'PENDIENTE'|'PARCIAL'|'PAGADO'|'CANCELADO', dueInDays = 15, partialUSD?: number, entryId = 're_demo_1') {
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + dueInDays);
  const receivable = await prisma.receivable.upsert({ where: { orderId }, update: { status: status as any, dueDate }, create: { orderId, status: status as any, dueDate } });
  if (partialUSD) {
    await prisma.receivableEntry.upsert({
      where: { id: entryId },
      update: { receivableId: receivable.id, amountUSD: partialUSD, currency: Currency.USD, method: PaymentMethod.TRANSFERENCIA, reference: 'TR-DEMO' },
      create: { id: entryId, receivableId: receivable.id, amountUSD: partialUSD, currency: Currency.USD, method: PaymentMethod.TRANSFERENCIA, reference: 'TR-DEMO' },
    });
  }
  return receivable;
}

async function createPOWithItems(opts: { id: string; supplierId: string; createdById: string; items: Array<{ productSlug: string; quantity: number; costUSD: number }>; status?: POStatus }) {
  const prods = await getProducts(opts.items.map(i => i.productSlug));
  if (prods.length !== opts.items.length) throw new Error('Faltan productos para PO ' + opts.id);
  const itemsCreate = prods.map((p, idx) => ({ productId: p.id, quantity: opts.items[idx].quantity, costUSD: opts.items[idx].costUSD as any }));
  const totalUSD = itemsCreate.reduce((a, it) => a + Number(it.costUSD) * it.quantity, 0);
  const po = await prisma.purchaseOrder.upsert({
    where: { id: opts.id },
    update: { supplierId: opts.supplierId, status: opts.status ?? POStatus.ORDERED, totalUSD: totalUSD as any, createdById: opts.createdById, items: { deleteMany: {}, create: itemsCreate } },
    create: { id: opts.id, supplierId: opts.supplierId, status: opts.status ?? POStatus.ORDERED, totalUSD: totalUSD as any, createdById: opts.createdById, items: { create: itemsCreate } },
    include: { items: true },
  });
  return po;
}

async function receivePOAndStock(poId: string, receiverId: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId }, include: { items: true } });
  if (!po) throw new Error('PO no existe: ' + poId);
  for (const it of po.items) {
    const qty = it.quantity - it.received;
    if (qty > 0) {
      await prisma.purchaseOrderItem.update({ where: { id: it.id }, data: { received: { increment: qty } } });
      await prisma.stockMovement.create({ data: { productId: it.productId, type: StockMoveType.ENTRADA, quantity: qty, reason: `PO_RECEIPT ${poId}`, userId: receiverId } });
      const product = await prisma.product.findUnique({ where: { id: it.productId } });
      const oldStock = Number(product?.stock || 0);
      const oldAvg = Number(product?.avgCost || 0);
      const newAvg = (oldStock * oldAvg + qty * Number(it.costUSD)) / Math.max(1, oldStock + qty);
      await prisma.product.update({ where: { id: it.productId }, data: { stock: { increment: qty }, lastCost: it.costUSD as any, avgCost: newAvg as any, costMethod: CostMethod.PROMEDIO } });
    }
  }
  await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: POStatus.RECEIVED, receivedById: receiverId, receivedAt: new Date() as any } });
}

async function saleStockOut(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  for (const it of order.items) {
    await prisma.stockMovement.create({ data: { productId: it.productId, type: StockMoveType.SALIDA, quantity: it.quantity, reason: `SALE ${orderId}`, userId } });
    await prisma.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
  }
}

async function createQuotes(customerId: string, sellerId: string) {
  const [p1, p2] = await getProducts(['gabinete-cocina-moderno', 'espejo-bano-led']);
  const mk = async (id: string, status: QuoteStatus, days = 7) => {
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return prisma.quote.upsert({
      where: { id },
      update: { userId: customerId, sellerId, status, expiresAt, subtotalUSD: 100, ivaPercent: 16 as any, tasaVES: 40 as any, totalUSD: 116 as any, totalVES: 4640 as any, items: { deleteMany: {}, create: [{ productId: p1.id, name: p1.name, priceUSD: Number(p1.priceUSD), quantity: 1 }, { productId: p2.id, name: p2.name, priceUSD: Number(p2.priceUSD), quantity: 1 }] } },
      create: { id, userId: customerId, sellerId, status, expiresAt, subtotalUSD: 100 as any, ivaPercent: 16 as any, tasaVES: 40 as any, totalUSD: 116 as any, totalVES: 4640 as any, items: { create: [{ productId: p1.id, name: p1.name, priceUSD: Number(p1.priceUSD), quantity: 1 }, { productId: p2.id, name: p2.name, priceUSD: Number(p2.priceUSD), quantity: 1 }] } },
    });
  };
  await mk('q_demo_1', QuoteStatus.BORRADOR, 7);
  await mk('q_demo_2', QuoteStatus.ENVIADO, 5);
  await mk('q_demo_3', QuoteStatus.APROBADO, 10);
  await mk('q_demo_4', QuoteStatus.RECHAZADO, 3);
  await mk('q_demo_5', QuoteStatus.VENCIDO, -1);
}

async function main() {
  console.log('Seeding DEMO integral...');
  // Ajustes de sitio mínimos
  await prisma.siteSettings.upsert({ where: { id: 1 }, update: { lowStockThreshold: 5 as any, sellerCommissionPercent: 5 as any }, create: { id: 1, brandName: 'Carpihogar.ai', whatsappPhone: '+58 000-0000000', contactPhone: '+58 000-0000000', contactEmail: 'contacto@carpihogar.ai', ivaPercent: 16 as any, tasaVES: 40 as any, lowStockThreshold: 5 as any, sellerCommissionPercent: 5 as any } });

  // Usuarios base
  const admin = await prisma.user.findUnique({ where: { email: String(process.env.ROOT_EMAIL || 'root@carpihogar.com') } });
  const customer1 = await prisma.user.findUnique({ where: { email: 'cliente@carpihogar.ai' } });
  if (!admin || !customer1) throw new Error('Ejecuta primero npm run seed para usuarios base');
  const seller1 = await ensureUser('vendedor1@carpihogar.ai', Role.VENDEDOR, 'Vendedor Uno');
  const seller2 = await ensureUser('vendedor2@carpihogar.ai', Role.VENDEDOR, 'Vendedor Dos');
  const customer2 = await ensureUser('cliente2@carpihogar.ai', Role.CLIENTE, 'Cliente Dos');

  // Direcciones
  await prisma.address.upsert({ where: { id: 'addr_demo_c1' }, update: { userId: customer1.id, fullname: 'Cliente Demo', phone: '+58 424-111-1111', state: 'Distrito Capital', city: 'Caracas', address1: 'Calle 1', zone: 'Chacao' }, create: { id: 'addr_demo_c1', userId: customer1.id, fullname: 'Cliente Demo', phone: '+58 424-111-1111', state: 'Distrito Capital', city: 'Caracas', address1: 'Calle 1', zone: 'Chacao' } });
  await prisma.address.upsert({ where: { id: 'addr_demo_c2' }, update: { userId: customer2.id, fullname: 'Cliente Dos', phone: '+58 424-222-2222', state: 'Barinas', city: 'Barinas', address1: 'Av. 2', zone: 'Centro' }, create: { id: 'addr_demo_c2', userId: customer2.id, fullname: 'Cliente Dos', phone: '+58 424-222-2222', state: 'Barinas', city: 'Barinas', address1: 'Av. 2', zone: 'Centro' } });

  // Proveedores y asignación
  const { s1, s2 } = await ensureSuppliers();
  const [pA, pB, pC, pD] = await getProducts(['gabinete-cocina-moderno','closet-6-puertas','espejo-bano-led','mueble-lavamanos']);
  await prisma.product.updateMany({ where: { id: { in: [pA.id, pC.id] } }, data: { supplierId: s1.id } });
  await prisma.product.updateMany({ where: { id: { in: [pB.id, pD.id] } }, data: { supplierId: s2.id } });

  // Órdenes adicionales y variaciones de estados/pagos/envíos
  const o4 = await upsertOrder({
    id: 'o_demo_4', customerId: customer1.id, sellerId: seller1.id, addressId: 'addr_demo_c1',
    items: [ { productSlug: 'isla-cocina-granito', qty: 1 }, { productSlug: 'lampara-techo-decorativa', qty: 2 } ],
    status: OrderStatus.CONFIRMACION, saleType: SaleType.CONTADO, payment: { method: PaymentMethod.TRANSFERENCIA, status: PaymentStatus.EN_REVISION, reference: 'TR-DEMO-1' }
  });
  await upsertShipping(o4.id, { carrier: ShippingCarrier.FLETE_PRIVADO, channel: ShippingChannel.TIENDA, status: ShippingStatus.PREPARANDO, observations: 'Preparando pedido', tracking: null });
  await upsertCommission(o4.id, seller1.id, 7);

  const o5 = await upsertOrder({
    id: 'o_demo_5', customerId: customer2.id, sellerId: seller2.id, addressId: 'addr_demo_c2',
    items: [ { productSlug: 'organizador-closet-modular', qty: 2 }, { productSlug: 'set-cojines-decorativos', qty: 4 } ],
    status: OrderStatus.PAGADO, saleType: SaleType.CONTADO, payment: { method: PaymentMethod.PAGO_MOVIL, status: PaymentStatus.APROBADO, reference: 'PM-DEMO-2' }
  });
  await upsertShipping(o5.id, { carrier: ShippingCarrier.DELIVERY, channel: ShippingChannel.ONLINE, status: ShippingStatus.DESPACHADO, observations: 'Salida a reparto', tracking: 'DL-0005' });
  await upsertCommission(o5.id, seller2.id, 5);

  const o6 = await upsertOrder({
    id: 'o_demo_6', customerId: customer1.id, sellerId: seller2.id, addressId: 'addr_demo_c1',
    items: [ { productSlug: 'gabinete-cocina-moderno', qty: 1 } ],
    status: OrderStatus.CANCELADO, saleType: SaleType.CONTADO, payment: { method: PaymentMethod.ZELLE, status: PaymentStatus.RECHAZADO, reference: 'ZL-FAIL' }
  });
  await upsertShipping(o6.id, { carrier: ShippingCarrier.OTRO, channel: ShippingChannel.ONLINE, status: ShippingStatus.INCIDENCIA, observations: 'Pedido cancelado por cliente', tracking: '' });
  await upsertCommission(o6.id, seller2.id, 5);

  // Venta a crédito adicional
  const o7 = await upsertOrder({
    id: 'o_demo_7', customerId: customer2.id, sellerId: seller1.id, addressId: 'addr_demo_c2',
    items: [ { productSlug: 'mueble-lavamanos', qty: 1 }, { productSlug: 'espejo-bano-led', qty: 1 } ],
    status: OrderStatus.PENDIENTE, saleType: SaleType.CREDITO, creditDueDate: new Date(Date.now() + 1000*60*60*24*20), payment: null
  });
  await upsertShipping(o7.id, { carrier: ShippingCarrier.FLETE_PRIVADO, channel: ShippingChannel.ONLINE, status: ShippingStatus.EN_TRANSITO, observations: 'Ruta Barinas', tracking: 'FP-0007' });
  await upsertCommission(o7.id, seller1.id, 6);
  await upsertReceivable(o7.id, 'PENDIENTE', 20);

  // Receivable pagado totalmente
  const o8 = await upsertOrder({
    id: 'o_demo_8', customerId: customer1.id, sellerId: seller1.id, addressId: 'addr_demo_c1',
    items: [ { productSlug: 'closet-6-puertas', qty: 1 } ],
    status: OrderStatus.COMPLETADO, saleType: SaleType.CREDITO, creditDueDate: new Date(Date.now() + 1000*60*60*24*10), payment: null
  });
  await upsertShipping(o8.id, { carrier: ShippingCarrier.TEALCA, channel: ShippingChannel.ONLINE, status: ShippingStatus.ENTREGADO, observations: 'Entregado', tracking: 'T-0008' });
  await upsertCommission(o8.id, seller1.id, 5);
  // Marcar receivable como pagado con 2 abonos
  await upsertReceivable(o8.id, 'PARCIAL', 10, 50, 're_demo_2');
  await prisma.receivableEntry.create({ data: { id: 're_demo_3', receivableId: (await prisma.receivable.findUnique({ where: { orderId: o8.id } }))!.id, amountUSD: 999 as any, currency: Currency.USD, method: PaymentMethod.ZELLE, reference: 'ZL-DEMO' } }).catch(() => {});
  await prisma.receivable.update({ where: { orderId: o8.id }, data: { status: 'PAGADO' as any } });

  // Stock: recibir una OC y registrar salidas por ventas
  const po1 = await createPOWithItems({ id: 'po_demo_1', supplierId: s1.id, createdById: admin.id, items: [ { productSlug: 'gabinete-cocina-moderno', quantity: 5, costUSD: 350 }, { productSlug: 'espejo-bano-led', quantity: 10, costUSD: 70 } ], status: POStatus.ORDERED });
  const po2 = await createPOWithItems({ id: 'po_demo_2', supplierId: s2.id, createdById: admin.id, items: [ { productSlug: 'organizador-closet-modular', quantity: 8, costUSD: 100 }, { productSlug: 'set-cojines-decorativos', quantity: 20, costUSD: 10 } ], status: POStatus.ORDERED });
  await receivePOAndStock(po2.id, admin.id); // deja po2 como RECEIVED y actualiza stock/costos
  // registrar salidas por algunas órdenes
  await saleStockOut(o5.id, admin.id);
  // Ajuste manual de stock
  const prodAdj = await prisma.product.findFirst({ where: { slug: 'lampara-techo-decorativa' } });
  if (prodAdj) {
    await prisma.stockMovement.create({ data: { productId: prodAdj.id, type: StockMoveType.AJUSTE, quantity: 1, reason: 'Ajuste demo +1', userId: admin.id } });
    await prisma.product.update({ where: { id: prodAdj.id }, data: { stock: { increment: 1 } } });
  }

  // Cotizaciones en varios estados
  await createQuotes(customer1.id, seller1.id);

  console.log('Seeding DEMO completado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
