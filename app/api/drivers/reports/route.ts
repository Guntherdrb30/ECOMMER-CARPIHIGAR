import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ ok: false }, { status: 403 });
  const since = new Date(Date.now() - 1000*60*60*24*30);
  const shipments = await prisma.shipping.findMany({ where: { createdAt: { gte: since as any } }, include: { order: { include: { shippingAddress: true } } } });
  const byCity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const s of shipments) {
    const c = String(s.order?.shippingAddress?.city || 'N/A');
    byCity[c] = (byCity[c] || 0) + 1;
    const st = String(s.status);
    byStatus[st] = (byStatus[st] || 0) + 1;
  }
  return NextResponse.json({ ok: true, byCity, byStatus, total: shipments.length });
}

