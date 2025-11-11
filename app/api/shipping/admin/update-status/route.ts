import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import '@/server/events/register';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emit } from '@/server/events/bus';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ ok: false }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const shipmentId = String((body as any)?.shipmentId || '').trim();
  const status = String((body as any)?.status || '').toUpperCase();
  if (!shipmentId || !status) return NextResponse.json({ ok: false }, { status: 400 });
  const sh = await prisma.shipping.update({ where: { id: shipmentId }, data: { status: status as any } });
  await emit('shipment.status.changed', { shipmentId, status, orderId: sh.orderId });
  return NextResponse.json({ ok: true });
}

