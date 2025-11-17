'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getBankAccounts() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  return prisma.bankAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createBankAccount(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  const name = String(formData.get('name') || '').trim();
  const bankName = String(formData.get('bankName') || '').trim();
  const accountNumber = String(formData.get('accountNumber') || '').trim();
  const currency = String(formData.get('currency') || 'USD').toUpperCase() as any;
  const initialBalanceRaw = String(formData.get('initialBalance') || '').trim();
  const initialBalance =
    initialBalanceRaw && !isNaN(Number(initialBalanceRaw))
      ? Number(initialBalanceRaw)
      : 0;
  if (!name) {
    throw new Error('Nombre requerido');
  }
  await prisma.bankAccount.create({
    data: {
      name,
      bankName: bankName || null,
      accountNumber: accountNumber || null,
      currency,
      initialBalance: initialBalance as any,
    },
  });
  revalidatePath('/dashboard/admin/bancos');
}

export async function getBankTransactions(bankAccountId?: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  const where: any = {};
  if (bankAccountId) where.bankAccountId = bankAccountId;
  return prisma.bankTransaction.findMany({
    where,
    include: { bankAccount: true, purchase: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

