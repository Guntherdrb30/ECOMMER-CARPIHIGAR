import { NextResponse } from 'next/server';
import { sendVerificationToken } from '@/server/integrations/whatsapp/sendVerificationToken';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const customerId = String(body?.customerId || '').trim();
  const phone = String(body?.phone || '').trim();
  const orderTempId = String(body?.orderTempId || '').trim();
  if (!customerId || !phone || !orderTempId) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await sendVerificationToken(customerId, phone, orderTempId);
  return NextResponse.json({ ok: r.ok });
}
