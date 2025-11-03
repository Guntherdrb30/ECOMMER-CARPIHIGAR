import prisma from '@/lib/prisma';
import { EnviosClient } from '../EnviosClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function EnviosOnlinePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'asc' },
    where: { shipping: { channel: 'ONLINE' } },
    include: {
      user: { select: { name: true, email: true } },
      shipping: true,
    },
  });

  const typedOrders = orders.map((order) => ({
    ...order,
    user: order.user ? order.user : { name: 'N/A', email: 'N/A' },
    shipping: order.shipping,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Envios Online</h1>
      <EnviosClient orders={typedOrders} role={role} />
    </div>
  );
}
