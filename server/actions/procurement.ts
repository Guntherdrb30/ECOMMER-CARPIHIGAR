'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getPurchases(filters?: { q?: string; supplierId?: string; from?: string; to?:string }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
    const where: any = {};
    if (filters?.q) {
      const q = String(filters.q);
      where.OR = [
        { id: { contains: q } },
        { id: { endsWith: q } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters?.supplierId) where.supplierId = String(filters.supplierId);
    if (filters?.from || filters?.to) {
      const createdAt: any = {};
      if (filters?.from) {
        const d = new Date(String(filters.from));
        if (!isNaN(d.getTime())) createdAt.gte = d as any;
      }
      if (filters?.to) {
        const d = new Date(String(filters.to));
        if (!isNaN(d.getTime())) { const next = new Date(d); next.setDate(next.getDate() + 1); createdAt.lt = next as any; }
      }
      if (Object.keys(createdAt).length) where.createdAt = createdAt;
    }
    return prisma.purchase.findMany({ where, include: { supplier: true, items: true, createdBy: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return [];
  }
}

export async function getSuppliers() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
    return prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

export async function createSupplier(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const name = String(formData.get('name') || '');
  const email = String(formData.get('email') || '');
  const phone = String(formData.get('phone') || '');
  const taxId = String(formData.get('taxId') || '');
  const address = String(formData.get('address') || '');
  if (!name.trim()) redirect('/dashboard/admin/proveedores?error=Nombre%20requerido');
  await prisma.supplier.create({ data: { name, email: email || null, phone: phone || null, taxId: taxId || null, address: address || null } });
  revalidatePath('/dashboard/admin/proveedores');
  redirect('/dashboard/admin/proveedores?message=Proveedor%20creado');
}

export async function getPOs(filters?: { q?: string; supplierId?: string; from?: string; to?: string; status?: 'DRAFT'|'ORDERED'|'RECEIVED'|'CANCELLED'|string }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
    const where: any = {};
    if (filters?.q) {
      const q = String(filters.q);
      where.OR = [
        { id: { contains: q } },
        { id: { endsWith: q } },
      ];
    }
    if (filters?.supplierId) {
      where.supplierId = String(filters.supplierId);
    }
    if (filters?.status) {
      const st = String(filters.status).toUpperCase();
      if (['DRAFT','ORDERED','RECEIVED','CANCELLED'].includes(st)) {
        where.status = st as any;
      }
    }
    if (filters?.from || filters?.to) {
      const createdAt: any = {};
      if (filters?.from) {
        const d = new Date(String(filters.from));
        if (!isNaN(d.getTime())) createdAt.gte = d as any;
      }
      if (filters?.to) {
        const d = new Date(String(filters.to));
        if (!isNaN(d.getTime())) {
          const next = new Date(d); next.setDate(next.getDate() + 1);
          createdAt.lt = next as any;
        }
      }
      if (Object.keys(createdAt).length) where.createdAt = createdAt;
    }
    return prisma.purchaseOrder.findMany({ where, include: { supplier: true, items: true, createdBy: true, receivedBy: true }, orderBy: { createdAt: 'desc' } });
  } catch (error) {
    console.error("Error fetching POs:", error);
    return [];
  }
}

export async function createPO(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const supplierId = String(formData.get('supplierId') || '');
  const expectedAt = String(formData.get('expectedAt') || '');
  const itemsJson = String(formData.get('items') || '[]');
  const notes = String(formData.get('notes') || '');
  const items: Array<{ productId: string; quantity: number; costUSD: number }> = JSON.parse(itemsJson || '[]');
  if (!supplierId || !items.length) redirect('/dashboard/admin/compras/nueva?error=Proveedor%20e%20items%20requeridos');
  const totalUSD = items.reduce((a, it) => a + Number(it.quantity) * Number(it.costUSD), 0);
  const po = await prisma.purchaseOrder.create({ data: {
    supplierId,
    status: 'ORDERED' as any,
    expectedAt: expectedAt ? (new Date(expectedAt) as any) : null,
    notes: notes || null,
    totalUSD: totalUSD as any,
    createdById: (session?.user as any)?.id,
    items: { create: items.map(it => ({ productId: it.productId, quantity: Number(it.quantity), costUSD: Number(it.costUSD) as any })) },
  }});
  try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'PO_CREATE', details: po.id } }); } catch {}
  revalidatePath('/dashboard/admin/compras');
  redirect('/dashboard/admin/compras?message=OC%20creada');
}

export async function getPOById(id: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  return prisma.purchaseOrder.findUnique({ where: { id }, include: { supplier: true, createdBy: true, receivedBy: true, items: { include: { product: true } } } });
}

export async function receivePO(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const poId = String(formData.get('poId') || '');
  const itemsJson = String(formData.get('items') || '[]');
  const items: Array<{ itemId: string; qty: number }> = JSON.parse(itemsJson || '[]');
  if (!poId || !items.length) redirect(`/dashboard/admin/compras/${poId}?error=Items%20requeridos`);
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId }, include: { items: true } });
  if (!po) redirect('/dashboard/admin/compras?error=OC%20no%20existe');

  for (const it of items) {
    const dbItem = po.items.find(x => x.id === it.itemId);
    if (!dbItem) continue;
    const receiveQty = Math.max(0, Math.min(Number(it.qty || 0), dbItem.quantity - dbItem.received));
    if (!receiveQty) continue;
    // update received
    await prisma.purchaseOrderItem.update({ where: { id: dbItem.id }, data: { received: { increment: receiveQty } } });
    // stock movement
    await prisma.stockMovement.create({ data: { productId: dbItem.productId, type: 'ENTRADA' as any, quantity: receiveQty, reason: `PO_RECEIPT ${poId}`, userId: (session?.user as any)?.id } });
    // cost update avg
    const product = await prisma.product.findUnique({ where: { id: dbItem.productId } });
    const oldStock = Number(product?.stock || 0);
    const oldAvg = Number(product?.avgCost || 0);
    const newAvg = (oldStock * oldAvg + receiveQty * Number(dbItem.costUSD)) / Math.max(1, oldStock + receiveQty);
    await prisma.product.update({ where: { id: dbItem.productId }, data: { stock: { increment: receiveQty }, lastCost: dbItem.costUSD as any, avgCost: newAvg as any } });
  }
  // Set PO status to RECEIVED if all items received
  const updated = await prisma.purchaseOrder.findUnique({ where: { id: poId }, include: { items: true } });
  const allReceived = updated?.items.every(x => x.received >= x.quantity);
  if (allReceived) {
    await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: 'RECEIVED' as any, receivedById: (session?.user as any)?.id, receivedAt: new Date() as any } });
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'PO_RECEIVE', details: poId } }); } catch {}
  }

  revalidatePath(`/dashboard/admin/compras/${poId}`);
  redirect(`/dashboard/admin/compras/${poId}?message=Recepci%C3%B3n%20registrada`);
}
