import { NextRequest, NextResponse } from 'next/server';
import { ingestInboundMessage } from '@/server/actions/messaging';

// WhatsApp Cloud API verification
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && challenge && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const entries = json?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages || [];
        for (const m of messages) {
          if (m?.type === 'text' && m?.from && m?.text?.body) {
            await ingestInboundMessage(m.from, m.text.body, m.id);
          }
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return new NextResponse(String(e), { status: 500 });
  }
}

