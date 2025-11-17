'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function recalcPayable(id: string) {
  const payable = await prisma.payable.findUnique({
    where: { id },
    include: { entries: true },
  });
  if (!payable) return;
  const abonadoUSD = (payable.entries || []).reduce(
    (acc, e: any) => acc + Number(e.amountUSD || 0),
    0,
  );
  const totalUSD = Number(payable.totalUSD || 0);
  const balanceUSD = Math.max(0, totalUSD - abonadoUSD);
  let status: any = 'PENDIENTE';
  if (balanceUSD <= 0.01) status = 'PAGADO';
  else if (abonadoUSD > 0) status = 'PARCIAL';
  await prisma.payable.update({
    where: { id },
    data: {
      status,
      balanceUSD: balanceUSD as any,
    },
  });
}

export async function getPayables(filters?: {
  status?: string;
  supplierId?: string;
  from?: string;
  to?: string;
  invoice?: string;
}) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  const where: any = {};
  if (filters?.status) {
    const st = String(filters.status).toUpperCase();
    if (['PENDIENTE', 'PARCIAL', 'PAGADO', 'CANCELADO'].includes(st)) {
      where.status = st as any;
    }
  }
  if (filters?.supplierId) {
    where.supplierId = String(filters.supplierId);
  }

  // Filtro por número de factura / compra
  if (filters?.invoice) {
    const inv = String(filters.invoice);
    const matches = await prisma.purchase.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: inv, mode: 'insensitive' } as any },
          { id: { contains: inv } as any },
        ],
      },
      select: { id: true },
    });
    const ids = matches.map((p) => p.id);
    if (!ids.length) return [];
    where.purchaseId = { in: ids };
  }
  if (filters?.from || filters?.to) {
    const createdAt: any = {};
    if (filters.from) {
      const d = new Date(String(filters.from));
      if (!isNaN(d.getTime())) createdAt.gte = d as any;
    }
    if (filters.to) {
      const d = new Date(String(filters.to));
      if (!isNaN(d.getTime())) {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        createdAt.lt = next as any;
      }
    }
    if (Object.keys(createdAt).length) where.createdAt = createdAt;
  }
  const payables = await prisma.payable.findMany({
    where,
    include: { entries: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const purchaseIds = payables.map((p) => p.purchaseId).filter(Boolean) as string[];
  const supplierIds = payables
    .map((p) => p.supplierId)
    .filter((id: any) => typeof id === 'string' && id.length) as string[];

  const [purchases, suppliers] = await Promise.all([
    purchaseIds.length
      ? prisma.purchase.findMany({ where: { id: { in: purchaseIds } } })
      : Promise.resolve([]),
    supplierIds.length
      ? prisma.supplier.findMany({ where: { id: { in: supplierIds } } })
      : Promise.resolve([]),
  ]);

  const purchaseMap = new Map(purchases.map((p: any) => [p.id, p]));
  const supplierMap = new Map(suppliers.map((s: any) => [s.id, s]));

  // Enriquecer cada payable con supplier y purchase para la UI
  return payables.map((p: any) => ({
    ...p,
    purchase: purchaseMap.get(p.purchaseId) || null,
    supplier: p.supplierId ? supplierMap.get(p.supplierId) || null : null,
  }));
}

export async function addPayablePayment(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  const payableId = String(formData.get('payableId') || '');
  if (!payableId) throw new Error('ID inválido');
  const currency = String(formData.get('currency') || 'USD').toUpperCase() as
    | 'USD'
    | 'VES'
    | 'USDT';
  const method = String(formData.get('method') || '') || null;
  const reference = String(formData.get('reference') || '') || null;
  const notes = String(formData.get('notes') || '') || null;
  const bankAccountIdRaw = String(formData.get('bankAccountId') || '') || null;
  const amountStr = String(formData.get('amount') || '0');
  const amount = Number(amountStr);
  if (!amount || amount <= 0) {
    throw new Error('Monto inválido');
  }

  const payable = await prisma.payable.findUnique({
    where: { id: payableId },
  });
  if (!payable) throw new Error('Cuenta por pagar no encontrada');

  await prisma.payableEntry.create({
    data: {
      payableId,
      amountUSD: amount as any,
      currency: currency as any,
      method: method as any,
      bankAccountId: bankAccountIdRaw || null,
      reference,
      notes,
    },
  });

  if (bankAccountIdRaw) {
    try {
      await prisma.bankTransaction.create({
        data: {
          bankAccountId: bankAccountIdRaw,
          type: 'DEBITO' as any,
          amount: amount as any,
          currency: currency as any,
          description: `Pago proveedor ${payable.supplierId || ''}`.trim(),
          reference,
          purchaseId: payable.purchaseId,
        },
      });
    } catch (e) {
      console.error('[payables] bankTransaction error', e);
    }
  }

  await recalcPayable(payableId);
  revalidatePath('/dashboard/admin/cuentas-por-pagar');
}
