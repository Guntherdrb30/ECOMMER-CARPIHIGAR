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

  try {
    const out: any[] = [];
    const flow = await runPurchaseConversation({ customerId, sessionId: undefined, message: text });
    const msgs = Array.isArray(flow?.messages) ? flow.messages : [];
    const ui = Array.isArray(flow?.uiActions) ? flow.uiActions : [];
    if (msgs.length || ui.length) {
      for (const m of msgs) {
        const t = String(m?.type || '').toLowerCase();
        if (t === 'text') out.push({ type: 'text', message: String(m?.content || m?.message || '') });
        else if (t === 'products') out.push({ type: 'products', products: m?.products || m?.data || [] });
        else if (t === 'cart') out.push({ type: 'cart', data: m?.data || {} });
        else out.push({ type: 'text', message: String(m?.content || '') });
      }
      const uiControl = ui.length ? ui[0] : undefined;
      return NextResponse.json({ messages: out, ...(uiControl ? { ui_control: uiControl } : {}) });
    }

    const res = await ProductsSearch.run({ q: text });
    if (res?.success && Array.isArray(res.data) && res.data.length) {
      out.push({ type: 'text', message: 'Perfecto, aquí tienes algunas opciones:' });
      out.push({ type: 'products', products: res.data } as any);
      return NextResponse.json({ messages: out });
    }
    out.push({ type: 'text', message: 'No encontré coincidencias exactas. ¿Puedes darme más detalles? (marca, tipo, color, medida)' });
    return NextResponse.json({ messages: out });
  } catch (e) {
    return NextResponse.json({ messages: [ { type: 'text', message: 'Tu mensaje fue recibido, pero hubo un problema procesándolo.' } ] });
  }
}

