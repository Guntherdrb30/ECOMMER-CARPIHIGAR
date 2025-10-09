import { NextRequest, NextResponse } from 'next/server';
import { ingestInboundMessage } from '@/server/actions/messaging';

// ManyChat inbound webhook -> Ingest into internal messaging
export async function POST(req: NextRequest) {
  try {
    // Auth: support Bearer token header or `?token=` query param
    const url = new URL(req.url);
    const headerAuth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const queryToken = url.searchParams.get('token') || '';
    const provided = headerAuth || queryToken;
    const expected = process.env.MANYCHAT_WEBHOOK_TOKEN || process.env.MANYCHAT_VERIFY_TOKEN || '';
    if (expected && provided !== expected) {
      console.warn('[ManyChat Webhook] Unauthorized request: missing/invalid token');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Attempt to extract phone and text from a few possible shapes
    const subscriber = (body?.subscriber || body?.contact || {}) as any;
    const fromObj = (body?.from || {}) as any;
    const messages = (body?.messages || []) as any[];

    const phone = String(
      subscriber?.phone || fromObj?.phone || body?.from || body?.phone || ''
    );

    const text = String(
      body?.message?.text || body?.text || body?.message_text || body?.data?.text || messages?.[0]?.text || ''
    ).trim();

    if (!phone || !text) {
      console.log('[ManyChat Webhook] Skipping payload (no phone/text)', { phone, hasText: Boolean(text) });
      // Return 200 so ManyChat doesn’t retry forever
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Ingest into Conversation/Message using existing server action
    const digits = phone.replace(/[^0-9]/g, '');
    await ingestInboundMessage(digits, text);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[ManyChat Webhook] Error', e);
    // Return 200 to avoid ManyChat retries; log for observability
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}

export async function GET() {
  // Optional: simple readiness probe
  return NextResponse.json({ ok: true });
}

