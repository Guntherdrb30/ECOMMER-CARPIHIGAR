import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function startOfDay(d: Date) { const x=new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x=new Date(d); x.setHours(23,59,59,999); return x; }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { deliveryUserId, from, to } = await req.json().catch(() => ({}));
  if (!deliveryUserId || !from || !to) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  const fromDate = startOfDay(new Date(from));
  const toDate = endOfDay(new Date(to));

  const orders = await prisma.order.findMany({
    where: {
      shipping: { carrier: 'DELIVERY' as any, assignedToId: deliveryUserId, status: 'ENTREGADO' as any },
      shippingAddress: { city: { equals: 'Barinas', mode: 'insensitive' } },
      updatedAt: { gte: fromDate, lte: toDate },
    },
    include: { shipping: true },
  });

  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) return NextResponse.json({ updated: 0 });

  const now = new Date();
  const result = await prisma.shipping.updateMany({
    where: { orderId: { in: orderIds } },
    data: { deliveryPaidAt: now as any },
  });

  return NextResponse.json({ updated: result.count, paidAt: now.toISOString() });
}
