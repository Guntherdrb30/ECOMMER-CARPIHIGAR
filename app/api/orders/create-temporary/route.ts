import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const customerId = String(body?.customerId || '').trim();
  const items = Array.isArray(body?.items) ? body.items : [];
  const shippingData = body?.shippingData || null;
  if (!customerId || !items.length) return NextResponse.json({ ok: false }, { status: 400 });
  const totalUSD = items.reduce((s: number, it: any) => s + (Number(it.priceUSD || 0) * Number(it.quantity || 0)), 0);
  const temp = await prisma.ordersTemp.create({ data: { customerId, items: items as any, totalUSD: totalUSD as any, shippingData: shippingData as any } });
  return NextResponse.json({ ok: true, id: temp.id });
}
