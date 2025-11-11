import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ ok: false }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = String(searchParams.get('status') || '');
  const city = String(searchParams.get('city') || '');
  const provider = String(searchParams.get('provider') || '');
  const where: any = {};
  if (status) where.status = status as any;
  if (provider) where.carrier = provider as any;
  const shipments = await prisma.shipping.findMany({ where, include: { order: { include: { user: true, shippingAddress: true } } }, orderBy: { updatedAt: 'desc' }, take: 50 });
  const rows = shipments.map((s) => ({ id: s.id, orderId: s.orderId, customer: s.order.user?.name || s.order.user?.email, city: s.order.shippingAddress?.city || '', provider: s.carrier, status: s.status, updatedAt: s.updatedAt }));
  return NextResponse.json({ ok: true, rows });
}
