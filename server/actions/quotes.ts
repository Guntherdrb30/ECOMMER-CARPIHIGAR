'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function autoExpireQuotes() {
  try {
    await prisma.quote.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: { notIn: ['APROBADO','RECHAZADO','VENCIDO'] as any },
      },
      data: { status: 'VENCIDO' as any },
    });
  } catch {}
}

export async function getQuotes(filters?: { q?: string; status?: 'BORRADOR'|'ENVIADO'|'APROBADO'|'RECHAZADO'|'VENCIDO'|string; sellerId?: string; from?: string; to?: string }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  await autoExpireQuotes();
  const where: any = {};
  if (filters?.status) {
    const st = String(filters.status).toUpperCase();
    if (['BORRADOR','ENVIADO','APROBADO','RECHAZADO','VENCIDO'].includes(st)) where.status = st as any;
  }
  if (filters?.sellerId) where.sellerId = String(filters.sellerId);
  if (filters?.from || filters?.to) {
    const createdAt: any = {};
    if (filters.from) { const d = new Date(String(filters.from)); if (!isNaN(d.getTime())) createdAt.gte = d as any; }
    if (filters.to) { const d = new Date(String(filters.to)); if (!isNaN(d.getTime())) { const next = new Date(d); next.setDate(next.getDate()+1); createdAt.lt = next as any; } }
    if (Object.keys(createdAt).length) where.createdAt = createdAt;
  }
  if (filters?.q) {
    const q = String(filters.q);
    where.OR = [
      { id: { contains: q } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }
  const quotes = await prisma.quote.findMany({ where, include: { user: true, seller: true, items: true }, orderBy: { createdAt: 'desc' } });
  return quotes;
}

export async function getQuoteById(id: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  await autoExpireQuotes();
  return prisma.quote.findUnique({ where: { id }, include: { user: true, seller: true, items: { include: { product: true } } } });
}

export async function createQuote(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN' && (session?.user as any)?.role !== 'VENDEDOR') {
    throw new Error('Not authorized');
  }
  const userEmail = String(formData.get('customerEmail') || '');
  const userName = String(formData.get('customerName') || '');
  const sellerId = String(formData.get('sellerId') || '');
  const itemsJson = String(formData.get('items') || '[]');
  const items: Array<{ productId: string; name: string; priceUSD: number; quantity: number } > = JSON.parse(itemsJson || '[]');
  const ivaPercentForm = formData.get('ivaPercent');
  const tasaVESForm = formData.get('tasaVES');
  const customerTaxId = (String(formData.get('customerTaxId') || '').trim() || null);
  const customerFiscalAddress = (String(formData.get('customerFiscalAddress') || '').trim() || null);
  const notes = String(formData.get('notes') || '');

  if (!items.length) redirect('/dashboard/admin/presupuestos/nuevo?error=Debes%20agregar%20al%20menos%20un%20producto');

  // Ensure customer exists or create a placeholder
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    user = await prisma.user.create({ data: { email: userEmail || `walkin_${Date.now()}@local`, password: '', name: userName || 'Cliente Presupuesto', role: 'CLIENTE', alliedStatus: 'NONE' } });
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const ivaPercent = ivaPercentForm !== null ? Number(ivaPercentForm) : Number(settings?.ivaPercent || 16);
  const tasaVES = tasaVESForm !== null ? Number(tasaVESForm) : Number(settings?.tasaVES || 40);

  const subtotalUSD = items.reduce((acc, it) => acc + (Number(it.priceUSD) * Number(it.quantity)), 0);
  const totalUSD = subtotalUSD * (1 + ivaPercent/100);
  const totalVES = totalUSD * tasaVES;

  const quote = await prisma.quote.create({
    data: {
      userId: user.id,
      sellerId: sellerId || null,
      subtotalUSD,
      ivaPercent,
      tasaVES,
      totalUSD,
      totalVES,
      status: 'BORRADOR' as any,
      notes: notes || null,
      customerTaxId: customerTaxId as any,
      customerFiscalAddress: customerFiscalAddress as any,
      items: { create: items.map(it => ({ productId: it.productId, name: it.name, priceUSD: it.priceUSD as any, quantity: it.quantity })) },
    },
  });

  try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'QUOTE_CREATE', details: quote.id } }); } catch {}
  revalidatePath('/dashboard/admin/presupuestos');
  redirect(`/dashboard/admin/presupuestos/${quote.id}?message=${encodeURIComponent('Presupuesto creado')}`);
}

export async function updateQuoteStatusByForm(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN' && (session?.user as any)?.role !== 'VENDEDOR') {
    throw new Error('Not authorized');
  }
  const id = String(formData.get('quoteId') || '');
  const statusRaw = String(formData.get('status') || '').toUpperCase();
  const allowed = ['BORRADOR','ENVIADO','APROBADO','RECHAZADO','VENCIDO'];
  const status = allowed.includes(statusRaw) ? statusRaw : 'BORRADOR';
  await prisma.quote.update({ where: { id }, data: { status: status as any } });
  try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'QUOTE_STATUS', details: `${id}:${status}` } }); } catch {}
  revalidatePath('/dashboard/admin/presupuestos');
  revalidatePath(`/dashboard/admin/presupuestos/${id}`);
  redirect(`/dashboard/admin/presupuestos/${id}?message=${encodeURIComponent('Estado actualizado a ' + status)}`);
}

export async function convertQuoteToOrder(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN' && (session?.user as any)?.role !== 'VENDEDOR') {
    throw new Error('Not authorized');
  }
  const id = String(formData.get('quoteId') || '');
  const shippingOption = String(formData.get('shippingOption') || '').toUpperCase();
  const quote = await prisma.quote.findUnique({ where: { id }, include: { items: true, user: true } });
  if (!quote) throw new Error('Quote not found');
  const order = await prisma.order.create({
    data: {
      userId: quote.userId,
      sellerId: quote.sellerId || null,
      subtotalUSD: quote.subtotalUSD as any,
      ivaPercent: quote.ivaPercent as any,
      tasaVES: quote.tasaVES as any,
      totalUSD: quote.totalUSD as any,
      totalVES: quote.totalVES as any,
      status: 'PENDIENTE' as any,
      items: { create: quote.items.map(it => ({ productId: it.productId, name: it.name, priceUSD: it.priceUSD as any, quantity: it.quantity })) },
    },
  });
  // Create default shipping for in-store handling
  try {
    // detect city from user's last address
    const addr = await prisma.address.findFirst({ where: { userId: quote.userId }, orderBy: { createdAt: 'desc' } });
    const isBarinas = !!addr && /barinas/i.test(String(addr?.city || ''));
    let carrier: any = isBarinas ? ('RETIRO_TIENDA' as any) : ('FLETE_PRIVADO' as any);
    if (shippingOption === 'RETIRO_TIENDA') carrier = 'RETIRO_TIENDA' as any;
    if (shippingOption === 'DELIVERY') carrier = 'DELIVERY' as any;
    const observations = (isBarinas || shippingOption) ? 'Cliente en Barinas: retiro en tienda o delivery incluido' : '';
    await prisma.shipping.create({
      data: {
        orderId: order.id,
        carrier,
        tracking: '',
        status: 'PENDIENTE' as any,
        channel: 'TIENDA' as any,
        observations,
      },
    });
  } catch {}
  await prisma.quote.update({ where: { id }, data: { status: 'APROBADO' as any } });
  try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'QUOTE_CONVERT_ORDER', details: `${id}->${order.id}` } }); } catch {}
  revalidatePath('/dashboard/admin/presupuestos');
  revalidatePath('/dashboard/admin/envios');
  try { revalidatePath('/dashboard/admin/envios/tienda'); } catch {}
  revalidatePath('/dashboard/admin/ventas');
  redirect(`/dashboard/admin/ventas?message=${encodeURIComponent('Venta creada desde presupuesto ' + id + ' (orden ' + order.id + ')')}`);
}

export async function updateQuoteExpiryByForm(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN' && (session?.user as any)?.role !== 'VENDEDOR') {
    throw new Error('Not authorized');
  }
  const id = String(formData.get('quoteId') || '');
  const expiresStr = String(formData.get('expiresAt') || '');
  const expiresAt = expiresStr ? new Date(expiresStr) : null;
  await prisma.quote.update({ where: { id }, data: { expiresAt: expiresAt as any } });
  try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'QUOTE_SET_EXPIRES', details: `${id}:${expiresStr}` } }); } catch {}
  revalidatePath('/dashboard/admin/presupuestos');
  revalidatePath(`/dashboard/admin/presupuestos/${id}`);
  redirect(`/dashboard/admin/presupuestos/${id}?message=${encodeURIComponent('Vencimiento actualizado')}`);
}
