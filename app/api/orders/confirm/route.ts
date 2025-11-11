import { NextResponse } from 'next/server';
import { verifyToken } from '@/server/integrations/whatsapp/verifyToken';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const customerId = String(body?.customerId || '').trim();
  const token = String(body?.token || '').trim();
  if (!customerId || !token) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await verifyToken(customerId, token);
  return NextResponse.json({ ok: r.ok, orderId: r.orderId || null });
}
