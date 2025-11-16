import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runPurchaseConversation } from '@/server/assistant/purchase/flowController';
import * as ProductsSearch from '@/agents/carpihogar-ai-actions/tools/products/searchProducts';
import crypto from 'crypto';

const ASSISTANT_SESSION_COOKIE = 'assistant_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getOrCreateAssistantSession(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${ASSISTANT_SESSION_COOKIE}=([^;]+)`));
  if (match) {
    return { sessionId: decodeURIComponent(match[1]), setCookieHeader: null as string | null };
  }
  const sessionId = crypto.randomUUID();
  const setCookieHeader = `${ASSISTANT_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax; HttpOnly`;
  return { sessionId, setCookieHeader };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || '').trim();

  const { sessionId, setCookieHeader } = getOrCreateAssistantSession(req);

  if (!text) {
    const res = NextResponse.json({ type: 'text', message: '��Puedes escribir tu consulta?' });
    if (setCookieHeader) res.headers.append('Set-Cookie', setCookieHeader);
    return res;
  }

  let customerId: string | undefined = undefined;
  try {
    const session = await getServerSession(authOptions);
    customerId = (session?.user as any)?.id as string | undefined;
  } catch {}

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      const emit = (obj: any) => controller.enqueue(enc.encode(JSON.stringify(obj) + '\n\n'));

      (async () => {
        try {
          // Intentar primero el flujo de compra guiado
          const flow = await runPurchaseConversation({ customerId, sessionId, message: text });
          const msgs = Array.isArray(flow?.messages) ? flow.messages : [];
          const ui = Array.isArray(flow?.uiActions) ? flow.uiActions : [];
          if (msgs.length || ui.length) {
            for (const m of msgs) {
              const t = String(m?.type || '').toLowerCase();
              if (t === 'text') emit({ type: 'text', message: String(m?.content || m?.message || '') });
              else if (t === 'products') emit({ type: 'products', products: m?.products || m?.data || [] });
              else if (t === 'cart') emit({ type: 'cart', data: m?.data || {} });
              else emit({ type: 'text', message: String(m?.content || '') });
            }
            for (const a of ui) emit(a);
            return;
          }
          // Busqueda de productos (fallback)
          const res = await ProductsSearch.run({ q: text });
          if (res?.success && Array.isArray(res.data) && res.data.length) {
            emit({ type: 'text', message: 'Perfecto, aqu�� tienes algunas opciones:' });
            emit({ type: 'products', products: res.data } as any);
          } else {
            emit({
              type: 'text',
              message: 'No encontr�� coincidencias exactas. ��Puedes darme m��s detalles? (marca, tipo, color, medida)',
            });
          }
        } catch (e) {
          emit({
            type: 'text',
            message: 'Tu mensaje fue recibido, pero hubo un problema proces��ndolo.',
          });
        } finally {
          try {
            controller.close();
          } catch {}
        }
      })();
    },
  });

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
  if (setCookieHeader) response.headers.append('Set-Cookie', setCookieHeader);
  return response;
}

