'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTopAllies() {
  const allies = await prisma.user.findMany({
    where: {
      role: 'ALIADO',
    },
    include: {
      orders: {
        where: {
          status: {
            in: ['COMPLETADO', 'PAGADO'],
          },
        },
        select: {
          totalUSD: true,
        },
      },
    },
  });

  const alliesWithTotalSales = allies.map(ally => {
    const totalSales = ally.orders.reduce((sum, order) => sum + Number(order.totalUSD), 0);
    return {
      id: ally.id,
      name: ally.name,
      totalSales,
    };
  });

  const sortedAllies = alliesWithTotalSales.sort((a, b) => b.totalSales - a.totalSales);

  return sortedAllies.slice(0, 5);
}
