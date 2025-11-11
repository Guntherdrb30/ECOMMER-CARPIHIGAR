import * as CartView from '@/agents/carpihogar-ai-actions/tools/cart/viewCart';
import * as ListAddresses from '@/agents/carpihogar-ai-actions/tools/customer/listAddresses';
import { detectMissing } from './missingData';

export async function handleBuyProcess({ customerId, sessionId }: { customerId?: string; sessionId?: string }) {
  const cart = await CartView.run({ customerId, sessionId });
  const items = cart?.data?.items || [];
  const addressList = await ListAddresses.run({ userId: customerId });
  const addressId = undefined as any;
  const missing = detectMissing({ items, addressId, quantity: items?.[0]?.quantity });
  const messages: any[] = [];
  const uiActions: any[] = [];
  if (missing.needQuantity) messages.push({ role: 'assistant', type: 'text', content: '¿Cuántas unidades deseas?' });
  if (missing.needAddress) {
    messages.push({ role: 'assistant', type: 'text', content: '¿A qué dirección lo enviamos? Puedes escoger una guardada o agregar una nueva.' });
    uiActions.push({ type: 'ui_control', action: 'show_address_picker', payload: { addresses: addressList?.data || [] } });
  }
  if (!messages.length) messages.push({ role: 'assistant', type: 'text', content: 'Perfecto. Puedo crear tu orden provisional y enviarte un código de confirmación.' });
  return { messages, uiActions };
}
