import * as CartRemove from '@/agents/carpihogar-ai-actions/tools/cart/removeFromCart';

export async function handleRemoveFromCart({ customerId, sessionId, entities, message }: { customerId?: string; sessionId?: string; entities?: any; message: string }) {
  const productId = String(entities?.productId || '').trim();
  if (!productId) return { messages: [{ role: 'assistant', type: 'text', content: 'Indícame cuál producto quieres retirar.' }] };
  await CartRemove.run({ customerId, sessionId, productId });
  return { messages: [{ role: 'assistant', type: 'text', content: 'Producto retirado del carrito.' }] };
}
