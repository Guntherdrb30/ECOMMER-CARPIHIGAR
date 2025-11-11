import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '');
  const meId = String((session?.user as any)?.id || '');
  if (!meId || (role !== 'DELIVERY' && role !== 'ADMIN')) return NextResponse.json({ ok: false }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = String(searchParams.get('status') || '');
  const city = String(searchParams.get('city') || '');
  const q = String(searchParams.get('q') || '');
  const where: any = { assignedToId: role === 'DELIVERY' ? meId : undefined };
  if (status) where.status = status as any;
  const shipments = await prisma.shipping.findMany({ where, include: { order: { include: { user: true, shippingAddress: true } } }, orderBy: { updatedAt: 'desc' }, take: 50 });
  const rows = shipments.filter((s) => (city ? new RegExp(city, 'i').test(String(s.order?.shippingAddress?.city || '')) : true) && (q ? (String(s.order?.id).includes(q) || String(s.tracking || '').includes(q)) : true)).map((s) => ({
    id: s.id,
    orderId: s.orderId,
    customer: s.order?.user?.name || s.order?.user?.email || '',
    address: `${s.order?.shippingAddress?.address1 || ''} ${s.order?.shippingAddress?.city || ''}`.trim(),
    city: s.order?.shippingAddress?.city || '',
    status: String(s.status),
    provider: String(s.carrier),
    tracking: s.tracking || undefined,
    updatedAt: s.updatedAt,
  }));
  return NextResponse.json({ ok: true, rows });
}

