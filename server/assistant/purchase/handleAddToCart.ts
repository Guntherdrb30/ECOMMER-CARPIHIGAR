import * as ProductsSearch from '@/agents/carpihogar-ai-actions/tools/products/searchProducts';
import * as CartAdd from '@/agents/carpihogar-ai-actions/tools/cart/addToCart';

export async function handleAddToCart({ customerId, sessionId, entities, message }: { customerId?: string; sessionId?: string; entities?: any; message: string }) {
  const name = String(entities?.productName || message || '').trim();
  if (!name) return { messages: [{ role: 'assistant', type: 'text', content: '¿Qué producto deseas agregar?' }] };
  const res = await ProductsSearch.run({ q: name });
  if (!res?.success || !res.data?.length) return { messages: [{ role: 'assistant', type: 'text', content: 'No encontré coincidencias exactas. ¿Puedes darme más detalles o el modelo?' }] };
  const p = res.data[0];
  const qty = Number(entities?.quantity || 1);
  await CartAdd.run({ customerId, sessionId, productId: p.id, quantity: qty });
  return {
    messages: [
      { role: 'assistant', type: 'text', content: `Agregado al carrito: ${p.name} x${qty}` },
    ],
    uiActions: [ { type: 'ui_control', action: 'add_to_cart_visual', payload: { product: p, quantity: qty } } ],
  };
}
