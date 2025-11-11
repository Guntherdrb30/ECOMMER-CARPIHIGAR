import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/server/integrations/whatsapp/verifyToken';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const phone = String((body as any)?.phone || (body as any)?.from || '').trim();
    const message = String((body as any)?.message || (body as any)?.text || '').trim();
    if (!phone) return NextResponse.json({ ok: false });

    const customer = await prisma.user.findFirst({ where: { phone } });
    if (!customer) return NextResponse.json({ ok: true });

    if (/^\d{4,8}$/.test(message)) {
      const r = await verifyToken(customer.id, message);
      if (r.ok) return NextResponse.json({ ok: true, reply: '¡Listo! Tu compra fue confirmada. Estamos procesando tu pedido.', orderId: (r as any).orderId });
      return NextResponse.json({ ok: true, reply: 'El código no es válido o expiró. Pide uno nuevo.' });
    }

    if (/^estado$/i.test(message)) {
      return NextResponse.json({ ok: true, reply: 'Para consultar tu estado, ingresa a tu panel o escribe el código de orden.' });
    }

    // Audio handling (placeholder)
    const audioUrl = ((body as any)?.audioUrl || (body as any)?.mediaUrl || ((body as any)?.media && (body as any).media.url)) as string | undefined;
    if (audioUrl) {
      try {
        const ares = await fetch(audioUrl);
        const abuf = await ares.arrayBuffer();
        const fd = new FormData();
        fd.append('file', new File([abuf], 'wa.ogg', { type: 'audio/ogg' }));
        const stt = await fetch(new URL('/api/voice/stt', req.url), { method: 'POST', body: fd });
        const sjson = await stt.json();
        const text = String((sjson as any)?.text || '').trim();
        if (text) {
          return NextResponse.json({ ok: true, reply: `Transcribí tu nota de voz: ${text}` });
        }
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

