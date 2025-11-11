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
  const shipmentId = String(body?.shipmentId || '').trim();
  const type = String(body?.type || '').trim();
  const url = String(body?.url || body?.dataUrl || '').trim();
  if (!shipmentId || !type || !url) return NextResponse.json({ ok: false }, { status: 400 });
  const s = await prisma.shipping.findUnique({ where: { id: shipmentId } });
  if (!s) return NextResponse.json({ ok: false }, { status: 404 });
  if (role === 'DELIVERY' && String(s.assignedToId || '') !== meId) return NextResponse.json({ ok: false }, { status: 403 });
  await prisma.shipmentPhoto.create({ data: { shipmentId, type, url } });
  return NextResponse.json({ ok: true });
}

