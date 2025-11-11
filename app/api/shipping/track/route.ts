import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = String(searchParams.get('orderId') || '').trim();
    const shipmentId = String(searchParams.get('shipmentId') || '').trim();
    if (!orderId && !shipmentId) return NextResponse.json({ ok: false, error: 'orderId o shipmentId requerido' }, { status: 400 });
    const session = await getServerSession(authOptions);
    const meId = (session?.user as any)?.id as string | undefined;
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const shipment = await prisma.shipping.findFirst({ where: shipmentId ? { id: shipmentId } : { orderId }, include: { order: { include: { user: true, shippingAddress: true } } } });
    if (!shipment) return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 });
    if (!isAdmin && meId && shipment.order.userId !== meId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    const provider = String(shipment.carrier);
    const trackingCode = shipment.tracking || undefined;
    const status = String(shipment.status);
    const eta = undefined;
    const timeline = [{ at: shipment.createdAt, status: 'CREATED' }, { at: shipment.updatedAt, status }];
    return NextResponse.json({ ok: true, status, provider, trackingCode, eta, timeline });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'Error' }, { status: 200 });
  }
}
