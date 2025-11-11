import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emit } from '@/server/events/bus';

const mapIn = {
  preparing: 'PREPARANDO',
  waiting_driver: 'PENDIENTE',
  assigned: 'DESPACHADO',
  in_route: 'EN_TRANSITO',
  delivered: 'ENTREGADO',
  incident: 'INCIDENCIA',
} as const;

function canTransition(from: string, to: string) {
  const order = ['PENDIENTE', 'PREPARANDO', 'DESPACHADO', 'EN_TRANSITO', 'ENTREGADO'];
  if (to === 'INCIDENCIA') return true;
  const i = order.indexOf(from);
  const j = order.indexOf(to);
  return j >= i && j - i <= 2; // allow same or forward within 2 steps
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '');
  const meId = String((session?.user as any)?.id || '');
  if (!meId || (role !== 'DELIVERY' && role !== 'ADMIN')) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const shipmentId = String(body?.shipmentId || '').trim();
  const newStatusIn = String(body?.newStatus || '').toLowerCase();
  const newStatus = (mapIn as any)[newStatusIn] || '';
  if (!shipmentId || !newStatus) return NextResponse.json({ ok: false }, { status: 400 });
  const s = await prisma.shipping.findUnique({ where: { id: shipmentId } });
  if (!s) return NextResponse.json({ ok: false }, { status: 404 });
  if (role === 'DELIVERY' && String(s.assignedToId || '') !== meId) return NextResponse.json({ ok: false }, { status: 403 });
  if (!canTransition(String(s.status), newStatus)) return NextResponse.json({ ok: false, error: 'Transición inválida' }, { status: 400 });
  await prisma.shipping.update({ where: { id: shipmentId }, data: { status: newStatus as any } });
  await emit('shipment.status.changed', { shipmentId, status: newStatus, orderId: s.orderId, customerId: undefined } as any);
  return NextResponse.json({ ok: true });
}

