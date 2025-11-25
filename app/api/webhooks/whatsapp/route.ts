import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTokenOrYes } from '@/server/ai/flows/purchaseFlow';
import { ingestInboundMessage } from '@/server/actions/messaging';
import { normalizeVePhone } from '@/lib/phone';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = String((body as any)?.phone || (body as any)?.from || '').trim();
    const message = String((body as any)?.message || (body as any)?.text || '').trim();

    const normalized = normalizeVePhone(rawPhone);
    const phone = normalized || rawPhone.replace(/[^0-9]/g, '');
    if (!phone || !message) return NextResponse.json({ ok: false });

    // Registrar siempre el mensaje entrante en la bandeja de mensajería
    try {
      const waId =
        (body as any)?.waMessageId ||
        (body as any)?.messageId ||
        (body as any)?.id;
      await ingestInboundMessage(phone, message, waId);
    } catch {
      // No romper el webhook si falla la ingesta
    }

    // Buscar usuario por phone normalizado
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) return NextResponse.json({ ok: true });

    // Buscar última orden en estado pendiente (aprox: Order.status = PENDIENTE)
    const order = await prisma.order.findFirst({
      where: { userId: user.id, status: 'PENDIENTE' as any },
      orderBy: { createdAt: 'desc' },
    });
    if (!order) return NextResponse.json({ ok: true });

    // Detectar confirmaciones
    const isYes = /s[ií]\s+autorizo/i.test(message);
    const tokenMatch = message.match(/\b(\d{6})\b/);
    if (isYes || tokenMatch) {
      const res = await validateTokenOrYes(
        { customerId: user.id },
        { orderId: order.id, confirmText: message, token: tokenMatch?.[1] },
      );
      // Aquí podrías notificar por WhatsApp con tu proveedor
      return NextResponse.json({ ok: true, result: res });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

