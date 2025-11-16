import * as CartView from '@/agents/carpihogar-ai-actions/tools/cart/viewCart';
import * as ListAddresses from '@/agents/carpihogar-ai-actions/tools/customer/listAddresses';

export async function handleBuyProcess({ customerId, sessionId }: { customerId?: string; sessionId?: string }) {
  const cart = await CartView.run({ customerId, sessionId });
  const items = cart?.data?.items || [];
  const messages: any[] = [];
  const uiActions: any[] = [];

  if (!items.length) {
    messages.push({
      role: 'assistant',
      type: 'text',
      content: 'Todavía no tienes productos en tu carrito. Primero elige un producto y añádelo al carrito con el botón correspondiente.',
    });
    return { messages, uiActions };
  }

  const addressList = await ListAddresses.run({ userId: customerId });

  messages.push({
    role: 'assistant',
    type: 'text',
    content: `Perfecto, tienes ${items.length} producto${items.length > 1 ? 's' : ''} en tu carrito. Cuando quieras, puedes proceder al pago y completar tus datos paso a paso.`,
  });
  messages.push({
    role: 'assistant',
    type: 'text',
    content: 'Si prefieres, también puedes ir al checkout con el botón “Proceder a pagar” para elegir moneda, método de pago y dirección de envío.',
  });

  if (addressList?.data && Array.isArray(addressList.data) && addressList.data.length) {
    uiActions.push({ type: 'ui_control', action: 'show_address_picker', payload: { addresses: addressList.data } });
  }

  return { messages, uiActions };
}

