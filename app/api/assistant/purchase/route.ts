import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runPurchaseConversation } from '@/server/assistant/purchase/flowController';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message || '').trim();
    if (!message) return NextResponse.json({ messages: [{ role: 'assistant', type: 'text', content: '¿Qué deseas comprar?' }] });
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id as string | undefined;
    const res = await runPurchaseConversation({ customerId, sessionId: undefined, message });
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ messages: [{ role: 'assistant', type: 'text', content: 'No pude procesar tu solicitud de compra.' }] });
  }
}
