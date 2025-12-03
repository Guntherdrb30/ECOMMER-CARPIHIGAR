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
      content:
        'Todavía no tienes productos en tu carrito. Primero elige un producto y añádelo al carrito con el botón correspondiente.',
    });
    return { messages, uiActions };
  }

  const addressList = await ListAddresses.run({ userId: customerId });

  // Resumen corto del carrito
  const count = items.length;
  const previewItems = items.slice(0, 3);
  const resumen =
    previewItems
      .map((it: any) => `${it.name} x${it.quantity}`)
      .join(', ') + (count > 3 ? ` y ${count - 3} producto(s) más` : '');
  const totals = cart?.data?.totals || {};
  const subtotalUSD = typeof totals.subtotalUSD === 'number' ? totals.subtotalUSD : undefined;
  const totalUSD = typeof totals.totalUSD === 'number' ? totals.totalUSD : undefined;

  messages.push({
    role: 'assistant',
    type: 'text',
    content: `Perfecto, tienes ${count} producto${count > 1 ? 's' : ''} en tu carrito. ${
      resumen ? `Por ejemplo: ${resumen}. ` : ''
    }${
      typeof totalUSD === 'number'
        ? `El total estimado es de US$${totalUSD.toFixed(2)} (subtotal US$${(subtotalUSD ?? totalUSD).toFixed(2)}).`
        : ''
    }`,
  });
  messages.push({
    role: 'assistant',
    type: 'text',
    content:
      'Te muestro tu carrito para que verifiques los productos. Luego, desde el botón "Proceder a pagar" podrás elegir la moneda (USD o VES), el método de pago (Zelle, pago móvil o transferencia) y confirmar tus datos de envío.',
  });

  // Abrir carrito visual en el panel del asistente
  uiActions.push({ type: 'ui_control', action: 'show_cart', payload: { cart: cart?.data || {} } });

  if (addressList?.data && Array.isArray(addressList.data) && addressList.data.length) {
    uiActions.push({ type: 'ui_control', action: 'show_address_picker', payload: { addresses: addressList.data } });
  }

  return { messages, uiActions };
}

