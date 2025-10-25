'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getAllyPendingSales() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const orders = await prisma.order.findMany({
    where: {
      seller: { role: 'ALIADO' as any },
      OR: [
        { status: 'CONFIRMACION' as any },
        { payment: { is: { status: 'EN_REVISION' as any } } },
      ],
    },
    include: { user: true, seller: true, payment: true },
    orderBy: { createdAt: 'desc' },
  });
  return orders;
}

export async function getAllyPendingSalesCount() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return 0;
  const count = await prisma.order.count({
    where: {
      seller: { role: 'ALIADO' as any },
      OR: [
        { status: 'CONFIRMACION' as any },
        { payment: { is: { status: 'EN_REVISION' as any } } },
      ],
    },
  });
  return count;
}

