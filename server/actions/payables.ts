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
  if (filters?.invoice) {
    const inv = String(filters.invoice);
    where.OR = [
      { purchase: { invoiceNumber: { contains: inv, mode: 'insensitive' } } },
      { purchaseId: { contains: inv } },
    ];
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
  return prisma.payable.findMany({
    where,
    include: {
      supplier: true,
      purchase: true,
      entries: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
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
    include: { purchase: true },
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

