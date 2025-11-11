import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTokenOrYes } from '@/server/ai/flows/purchaseFlow';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone || body?.from || '').trim();
    const message = String(body?.message || body?.text || '').trim();
    if (!phone || !message) return NextResponse.json({ ok: false });
    // Buscar usuario por phone exacto (puedes normalizar aquí)
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) return NextResponse.json({ ok: true });
    // Buscar última orden en estado pendiente (aprox: Order.status = PENDIENTE)
    const order = await prisma.order.findFirst({ where: { userId: user.id, status: 'PENDIENTE' as any }, orderBy: { createdAt: 'desc' } });
    if (!order) return NextResponse.json({ ok: true });
    // Detectar confirmaciones
    const isYes = /sí autorizo|si autorizo/i.test(message);
    const tokenMatch = message.match(/\b(\d{6})\b/);
    if (isYes || tokenMatch) {
      const res = await validateTokenOrYes({ customerId: user.id }, { orderId: order.id, confirmText: message, token: tokenMatch?.[1] });
      // Aquí podrías notificar por WhatsApp con tu proveedor
      return NextResponse.json({ ok: true, result: res });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
