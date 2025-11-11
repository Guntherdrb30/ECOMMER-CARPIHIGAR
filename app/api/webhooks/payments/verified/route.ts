import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import '@/server/events/register';
import { emit } from '@/server/events/bus';

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYMENTS_WEBHOOK_SECRET || '';
    const sig = (req.headers.get('x-webhook-signature') || '').trim();
    if (secret && sig !== secret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({} as any));
    const orderId = String((body as any)?.orderId || '').trim();
    const verified = Boolean((body as any)?.verified === true || String((body as any)?.verified).toLowerCase() === 'true');
    if (!orderId || !verified) return NextResponse.json({ ok: false });
    const order = await prisma.order.update({ where: { id: orderId }, data: { status: 'PAGADO' as any } });
    await emit('order.paid', { orderId: order.id, customerId: order.userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 200 });
  }
}

