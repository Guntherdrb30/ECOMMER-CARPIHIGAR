import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runPurchaseConversation } from '@/server/assistant/purchase/flowController';
import * as ProductsSearch from '@/agents/carpihogar-ai-actions/tools/products/searchProducts';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || '').trim();
  if (!text) return NextResponse.json({ type: 'text', message: '¿Puedes escribir tu consulta?' });

  const session = await getServerSession(authOptions);
  const customerId = (session?.user as any)?.id as string | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (obj: any) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n\n"));
      try {
        // Intentar primero el flujo de compra guiado
        const flow = await runPurchaseConversation({ customerId, sessionId: undefined, message: text });
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
          controller.close();
          return;
        }
        // Búsqueda de productos (fallback)
        const res = await ProductsSearch.run({ q: text });
        if (res?.success && Array.isArray(res.data) && res.data.length) {
          emit({ type: 'text', message: 'Perfecto, aquí tienes algunas opciones:' });
          emit({ type: 'products', products: res.data } as any);
        } else {
          emit({ type: 'text', message: 'No encontré coincidencias exactas. ¿Puedes darme más detalles? (marca, tipo, color, medida)' });
        }
      } catch (e) {
        emit({ type: 'text', message: 'Tu mensaje fue recibido, pero hubo un problema procesándolo.' });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
