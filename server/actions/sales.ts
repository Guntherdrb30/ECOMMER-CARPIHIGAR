'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function searchProducts(q: string) {
  const where: any = q ? { OR: [ { name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } } ] } : {};
  const items = await prisma.product.findMany({ where, take: 20, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, sku: true, priceUSD: true } });
  return items;
}

export async function getSellers() {
  const users = await prisma.user.findMany({ where: { role: 'VENDEDOR' }, select: { id: true, name: true, email: true } });
  return users;
}

export async function getSales(params?: { sellerId?: string; invoice?: string; cliente?: string; rif?: string }) {
  const where: any = {};
  if (params?.sellerId) where.sellerId = params.sellerId;
  if (params?.invoice) where.id = { contains: params.invoice } as any;
  if (params?.rif) where.customerTaxId = { contains: params.rif, mode: 'insensitive' } as any;
  if (params?.cliente) {
    where.user = { is: { OR: [
      { name: { contains: params.cliente, mode: 'insensitive' } as any },
      { email: { contains: params.cliente, mode: 'insensitive' } as any },
    ] } } as any;
  }
  const orders = await prisma.order.findMany({ where, include: { user: true, seller: true, payment: true }, orderBy: { createdAt: 'desc' } });
  return orders;
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: { user: true, seller: true, items: { include: { product: true } }, payment: true } });
  return order;
}

export async function getCommissions(params?: { sellerId?: string; status?: 'PENDIENTE' | 'PAGADA' }) {
  const where: any = {};
  if (params?.sellerId) where.sellerId = params.sellerId;
  if (params?.status) where.status = params.status as any;
  const commissions = await prisma.commission.findMany({ where, include: { seller: true, order: true }, orderBy: { createdAt: 'desc' } });
  return commissions;
}

export async function markCommissionPaid(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const id = String(formData.get('commissionId'));
  await prisma.commission.update({ where: { id }, data: { status: 'PAGADA' as any } });
  revalidatePath('/dashboard/admin/ventas');
}

export async function createOfflineSale(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN' && (session?.user as any)?.role !== 'VENDEDOR' && (session?.user as any)?.role !== 'ALIADO') {
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'OFFLINE_SALE_NOT_AUTHORIZED', details: '' } }); } catch {}
    throw new Error('Not authorized');
  }
  const userEmail = String(formData.get('customerEmail') || '');
  const userName = String(formData.get('customerName') || '');
  let sellerId = String(formData.get('sellerId') || '');
  const itemsJson = String(formData.get('items') || '[]');
  const items: Array<{ productId: string; name?: string; priceUSD: number; quantity: number } > = JSON.parse(itemsJson || '[]');
  const paymentMethod = String(formData.get('paymentMethod') || 'ZELLE').toUpperCase();
  const paymentCurrency = (String(formData.get('paymentCurrency') || 'USD').toUpperCase());
  const paymentReference = String(formData.get('paymentReference') || '');
  const payerName = String(formData.get('pm_payer_name') || '') || null;
  const payerPhone = String(formData.get('pm_payer_phone') || '') || null;
  const payerBank = String(formData.get('pm_bank') || '') || null;
  const shippingLocalOption = String(formData.get('shippingLocalOption') || '').toUpperCase();
  const saleTypeRaw = String(formData.get('saleType') || 'CONTADO').toUpperCase();
  const saleType = saleTypeRaw === 'CREDITO' ? 'CREDITO' : 'CONTADO';
  const creditDueDateStr = String(formData.get('creditDueDate') || '');
  const creditDueDate = creditDueDateStr ? new Date(creditDueDateStr) : null;
  const customerTaxId = (String(formData.get('customerTaxId') || '').trim() || null);
  const customerFiscalAddress = (String(formData.get('customerFiscalAddress') || '').trim() || null);
  const ivaPercentForm = formData.get('ivaPercent');
  const tasaVESForm = formData.get('tasaVES');
  const sendEmailFlag = String(formData.get('sendEmail') || '');
  const docTypeRaw = String(formData.get('docType') || 'recibo').toLowerCase();
  const allowedDocs = ['recibo','nota','factura'];
  const docType = (allowedDocs.includes(docTypeRaw) ? docTypeRaw : 'recibo') as 'recibo'|'nota'|'factura';

  if (!items.length) {
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'OFFLINE_SALE_VALIDATION_FAILED', details: 'No hay items' } }); } catch {}
    redirect('/dashboard/admin/ventas/nueva?error=Debes%20agregar%20al%20menos%20un%20producto');
  }
  if (saleType === 'CONTADO' && !['PAGO_MOVIL','TRANSFERENCIA','ZELLE'].includes(paymentMethod)) {
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'OFFLINE_SALE_VALIDATION_FAILED', details: 'Método de pago inválido' } }); } catch {}
    redirect('/dashboard/admin/ventas/nueva?error=M%C3%A9todo%20de%20pago%20inv%C3%A1lido');
  }
  if (saleType === 'CONTADO' && !paymentReference.trim()) {
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'OFFLINE_SALE_VALIDATION_FAILED', details: 'Referencia requerida' } }); } catch {}
    redirect('/dashboard/admin/ventas/nueva?error=La%20referencia%20de%20pago%20es%20obligatoria');
  }
  if (saleType === 'CONTADO' && paymentMethod === 'PAGO_MOVIL' && (!payerName || !payerPhone || !payerBank)) {
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'OFFLINE_SALE_VALIDATION_FAILED', details: 'Pago movil faltan datos titular/telefono/banco' } }); } catch {}
    redirect('/dashboard/admin/ventas/nueva?error=Para%20Pago%20M%C3%B3vil%20completa%20titular%2C%20tel%C3%A9fono%20y%20banco');
  }
  if (!customerTaxId || !customerFiscalAddress) {
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'OFFLINE_SALE_VALIDATION_FAILED', details: 'Faltan datos fiscales (RIF/Dirección)' } }); } catch {}
    redirect('/dashboard/admin/ventas/nueva?error=C%C3%A9dula%2FRIF%20y%20direcci%C3%B3n%20fiscal%20son%20obligatorias');
  }

  // Ensure customer exists or create a placeholder
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    user = await prisma.user.create({ data: { email: userEmail || `walkin_${Date.now()}@local`, password: '', name: userName || 'Cliente Tienda', role: 'CLIENTE', alliedStatus: 'NONE' } });
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const ivaPercent = ivaPercentForm !== null ? Number(ivaPercentForm) : Number(settings?.ivaPercent || 16);
  const tasaVES = tasaVESForm !== null ? Number(tasaVESForm) : Number(settings?.tasaVES || 40);
  let commissionPercent = Number((settings as any)?.sellerCommissionPercent || 5);
  let sellerRole: string | null = null;
  if (sellerId) {
    const seller = await prisma.user.findUnique({ where: { id: sellerId }, select: { commissionPercent: true, role: true } });
    sellerRole = (seller as any)?.role || null;
    if (seller?.commissionPercent !== null && seller?.commissionPercent !== undefined) {
      commissionPercent = Number(seller.commissionPercent as any);
    }
  }

  const subtotalUSD = items.reduce((acc, it) => acc + (Number(it.priceUSD) * Number(it.quantity)), 0);
  const totalUSD = subtotalUSD * (1 + ivaPercent/100);
  const totalVES = totalUSD * tasaVES;

  const order = await prisma.order.create({
    data: ({
      userId: user.id,
      sellerId: sellerId || null,
      subtotalUSD,
      ivaPercent,
      tasaVES,
      totalUSD,
      totalVES,
      status: (saleType === 'CONTADO' ? 'PAGADO' : 'PENDIENTE') as any,
      saleType: saleType as any,
      creditDueDate: creditDueDate as any,
      customerTaxId: customerTaxId as any,
      customerFiscalAddress: customerFiscalAddress as any,
      items: {
        create: items.map((it) => ({ productId: it.productId, name: it.name || '', priceUSD: it.priceUSD as any, quantity: it.quantity }))
      }
    } as any),
    include: { items: true }
  });

  // record payment as approved (solo si es contado)
  const validMethods = ['PAGO_MOVIL','TRANSFERENCIA','ZELLE'];
  const method = validMethods.includes(paymentMethod) ? (paymentMethod as any) : ('ZELLE' as any);
  const currency = paymentCurrency === 'VES' ? ('VES' as any) : ('USD' as any);
  if (saleType === 'CONTADO') {
    await prisma.payment.create({ data: { orderId: order.id, method, reference: paymentReference || null, status: 'APROBADO' as any, currency, payerName, payerPhone, payerBank } });
  }
  if (saleType === 'CREDITO') {
    try {
      await prisma.receivable.create({ data: { orderId: order.id, status: 'PENDIENTE' as any, dueDate: creditDueDate as any } });
    } catch {}
  }
  // Create shipping record for in-store (tienda) order
  try {
    // try to detect city from user's last address
    const addr = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    const isBarinas = !!addr && /barinas/i.test(String(addr?.city || ''));
    let carrier: any = isBarinas ? ('RETIRO_TIENDA' as any) : ('FLETE_PRIVADO' as any);
    if (shippingLocalOption === 'RETIRO_TIENDA') carrier = 'RETIRO_TIENDA' as any;
    if (shippingLocalOption === 'DELIVERY') carrier = 'DELIVERY' as any;
    const observations = (isBarinas || shippingLocalOption) ? 'Cliente en Barinas: retiro en tienda o delivery incluido' : '';
    await prisma.shipping.create({ data: { orderId: order.id, carrier, tracking: '', status: 'PENDIENTE' as any, channel: 'TIENDA' as any, observations } });
  } catch {}
  // send receipt email to customer if email present and prepare success message
  let successMessage = saleType === 'CREDITO' ? 'Venta a crédito creada' : 'Venta creada';
  if (process.env.EMAIL_ENABLED === 'true') {
    try {
      const { sendReceiptEmail } = await import('./email');
      const shouldSend = sendEmailFlag === 'true' || sendEmailFlag === 'on' || sendEmailFlag === '1';
      if (shouldSend && user.email) {
        const res: any = await sendReceiptEmail(order.id, user.email, docType, currency as any);
        if (res?.ok) {
          successMessage = `Venta creada - ${docType} enviada a ${user.email}`;
        } else {
          successMessage = 'Venta creada - No se pudo enviar el email';
        }
      }
    } catch {
      successMessage = 'Venta creada - No se pudo enviar el email';
    }
  }

  if (sellerId && sellerRole === 'VENDEDOR') {
    const amountUSD = Number((totalUSD * commissionPercent) / 100);
    await prisma.commission.create({ data: { orderId: order.id, sellerId, percent: commissionPercent as any, amountUSD: amountUSD as any } });
  }

  revalidatePath('/dashboard/admin/ventas');
  redirect(`/dashboard/admin/ventas?message=${encodeURIComponent(successMessage)}`);
}


  // If aliado, force sellerId to be current user
  if ((session?.user as any)?.role === 'ALIADO') {
    sellerId = String((session?.user as any)?.id || '');
  }
