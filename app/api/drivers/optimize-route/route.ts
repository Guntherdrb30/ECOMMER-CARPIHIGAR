import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '');
  const meId = String((session?.user as any)?.id || '');
  if (!meId || (role !== 'DELIVERY' && role !== 'ADMIN')) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const driverId = String(body?.driverId || meId);
  const shipments = await prisma.shipping.findMany({ where: { assignedToId: driverId, status: { in: ['PENDIENTE','DESPACHADO'] as any } }, include: { order: { include: { shippingAddress: true } } }, orderBy: { updatedAt: 'asc' } });
  // Fallback simple ordering by city name then created
  const ordered = shipments
    .map((s) => ({ id: s.id, city: String(s.order?.shippingAddress?.city || ''), addr: s.order?.shippingAddress?.address1 || '' }))
    .sort((a, b) => a.city.localeCompare(b.city));
  return NextResponse.json({ ok: true, order: ordered.map((x) => x.id) });
}

