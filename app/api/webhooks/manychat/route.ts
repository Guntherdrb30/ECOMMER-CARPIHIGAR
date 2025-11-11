import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/server/integrations/whatsapp/verifyToken';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone || body?.from || '').trim();
    const message = String(body?.message || body?.text || '').trim();
    if (!phone || !message) return NextResponse.json({ ok: false });
    const customer = await prisma.user.findFirst({ where: { phone } });
    if (!customer) return NextResponse.json({ ok: true });
    if (/^\d{4,8}$/.test(message)) {
      const r = await verifyToken(customer.id, message);
      if (r.ok) return NextResponse.json({ ok: true, reply: '¡Listo! Tu compra fue confirmada. Estamos procesando tu pedido.', orderId: r.orderId });
      return NextResponse.json({ ok: true, reply: 'El código no es válido o expiró. Pide uno nuevo.' });
    }
    if (/^estado$/i.test(message)) {
      // Could call shipping track and reply; placeholder
      return NextResponse.json({ ok: true, reply: 'Para consultar tu estado, ingresa a tu panel o escribe el código de orden.' });
    }\n    // Audio handling (placeholder)\n    const audioUrl = (body?.audioUrl || body?.mediaUrl || (body?.media && body.media.url)) as string | undefined;\n    if (audioUrl) {\n      try {\n        const ares = await fetch(audioUrl);\n        const abuf = await ares.arrayBuffer();\n        const fd = new FormData();\n        fd.append('file', new File([abuf], 'wa.ogg', { type: 'audio/ogg' }));\n        const stt = await fetch(new URL('/api/voice/stt', req.url), { method: 'POST', body: fd });\n        const sjson = await stt.json();\n        const text = String(sjson?.text || '').trim();\n        if (text) {\n          return NextResponse.json({ ok: true, reply: Transcribí tu nota de voz:  });\n        }\n      } catch {}\n    }\n    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

