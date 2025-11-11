import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/server/integrations/whatsapp/sendWhatsAppMessage';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone || '').trim();
  const text = String(body?.text || '').trim();
  if (!phone || !text) return NextResponse.json({ ok: false }, { status: 400 });
  const res = await sendWhatsAppMessage({ phone, text });
  return NextResponse.json({ ok: res.ok });
}
