import { NextResponse } from 'next/server';

export type FlowResult = { messages: any[]; uiActions?: any[]; audioUrl?: string };

export async function runPurchaseConversation({ customerId, sessionId, message }: { customerId?: string; sessionId?: string; message: string }): Promise<FlowResult> {
  const base = (() => {
    const p1 = (process.env.NEXT_PUBLIC_URL || '').trim();
    if (p1) return p1;
    const p2 = (process.env.NEXTAUTH_URL || '').trim();
    if (p2) return p2;
    const vercel = (process.env.VERCEL_URL || '').trim();
    if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`;
    return 'http://localhost:3000';
  })();
  const intentUrl = new URL('/api/assistant/intent', base).toString();
  const intentRes = await fetch(intentUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message }) }).then(r => r.json()).catch(() => ({ intent: 'buy', entities: {} }));
  const intent = String(intentRes?.intent || 'buy');
  const entities = intentRes?.entities || {};
  if (intent === 'add_to_cart') {
    const { handleAddToCart } = await import('./handleAddToCart');
    return await handleAddToCart({ customerId, sessionId, entities, message });
  }
  if (intent === 'remove_from_cart') {
    const { handleRemoveFromCart } = await import('./handleRemoveFromCart');
    return await handleRemoveFromCart({ customerId, sessionId, entities, message });
  }
  if (intent === 'buy') {
    const { handleBuyProcess } = await import('./handleBuyProcess');
    return await handleBuyProcess({ customerId, sessionId });
  }
  if (intent === 'confirm') {
    const tokenMatch = String(message || '').match(/\b(\d{4,8})\b/);
    const token = tokenMatch?.[1] || '';
    const { handleConfirmOrder } = await import('./handleConfirmOrder');
    if (!customerId) return { messages: [{ role: 'assistant', type: 'text', content: 'Necesito tu sesión para confirmar la compra.' }] } as any;
    return await handleConfirmOrder({ customerId, token });
  }
  // Default
  return { messages: [{ role: 'assistant', type: 'text', content: 'Te ayudo con tu compra. ¿Qué producto deseas?' }] } as any;
}

