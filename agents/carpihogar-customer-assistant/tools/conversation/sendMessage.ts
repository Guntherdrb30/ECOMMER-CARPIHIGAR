import { log } from '../../utils/logger';
import { searchProducts } from '../products/searchProducts';
import { getProductDetails } from '../products/getProductDetails';
import { addToCart } from '../cart/addToCart';
import { removeFromCart } from '../cart/removeFromCart';
import { viewCart } from '../cart/viewCart';
import { createOrderDraft } from '../orders/createOrderDraft';
import { generateConfirmationToken } from '../orders/generateConfirmationToken';
import { validateConfirmationToken } from '../orders/validateConfirmationToken';
import { initiateManualPayment } from '../orders/initiateManualPayment';
import { submitManualPayment } from '../orders/submitManualPayment';

export type AssistantChunk = {
  type: 'text' | 'voice' | 'rich';
  message?: string;
  audioBase64?: string;
  products?: any[];
  cart?: any;
  order?: any;
};

function detectIntent(text: string) {
  const t = text.toLowerCase();
  if (/ver\s+carrito|mi\s+carrito|carrito/.test(t)) return 'view_cart';
  if (/(agrega|añade|sumar|agregar)\s+/.test(t)) return 'add_to_cart';
  if (/(quita|remueve|elimina)\s+/.test(t)) return 'remove_from_cart';
  if (/buscar|busca|tienes|necesito|quiero/.test(t)) return 'search_products';
  if (/detalle|detalles|ver\s+producto/.test(t)) return 'product_detail';
  if (/comprar|iniciar\s+compra|hacer\s+pedido/.test(t)) return 'start_checkout';
  if (/token|confirmar|código/.test(t)) return 'confirm_order';
  if (/pago|pagar|transferencia|zelle|pago móvil|punto/.test(t)) return 'init_payment';
  return 'smalltalk';
}

export async function* sendMessage(input: { text: string; customerId?: string }) {
  const text = String(input.text || '').trim();
  log('assistant.intent', { text });
  if (!text) { yield { type: 'text', message: '¿Puedes contarme qué estás buscando?' }; return; }
  const intent = detectIntent(text);

  if (intent === 'search_products') {
    yield { type: 'text', message: 'Entendido. Estoy buscando opciones…' };
    const products = await searchProducts(text);
    if (products.length) {
      yield { type: 'rich', message: 'Te recomiendo estos productos:', products };
    } else {
      yield { type: 'text', message: 'No encontré productos con esa búsqueda. ¿Probamos con otro término?' };
    }
    return;
  }

  if (intent === 'product_detail') {
    // naive: extract first id/slug-like token from text
    const token = (text.match(/[a-z0-9\-]{6,}/i) || [])[0];
    if (!token) { yield { type: 'text', message: '¿Cuál producto quieres ver? Puedes darme el nombre o SKU.' }; return; }
    const p = await getProductDetails(token).catch(() => null);
    if (!p) { yield { type: 'text', message: 'No pude obtener el detalle. ¿Puedes intentar con otro identificador?' }; return; }
    yield { type: 'rich', products: [p], message: 'Aquí tienes los detalles:' };
    return;
  }

  if (intent === 'add_to_cart') {
    const id = (text.match(/[a-z0-9\-]{6,}/i) || [])[0];
    if (!id || !input.customerId) { yield { type: 'text', message: 'Para agregar, indícame el producto y asegúrate de estar identificado.' }; return; }
    await addToCart({ customerId: input.customerId, productId: id, qty: 1 });
    const cart = await viewCart({ customerId: input.customerId });
    yield { type: 'rich', cart: cart.cart, message: 'Listo, agregué el producto. Así va tu carrito:' };
    return;
  }

  if (intent === 'remove_from_cart') {
    const id = (text.match(/[a-z0-9\-]{6,}/i) || [])[0];
    if (!id || !input.customerId) { yield { type: 'text', message: 'Dime cuál producto quitar y asegúrate de estar identificado.' }; return; }
    await removeFromCart({ customerId: input.customerId, productId: id });
    const cart = await viewCart({ customerId: input.customerId });
    yield { type: 'rich', cart: cart.cart, message: 'He quitado el producto. Tu carrito ahora:' };
    return;
  }

  if (intent === 'view_cart') {
    if (!input.customerId) { yield { type: 'text', message: 'Para ver tu carrito, necesito identificarte.' }; return; }
    const cart = await viewCart({ customerId: input.customerId });
    yield { type: 'rich', cart: cart.cart, message: 'Este es tu carrito actual:' };
    return;
  }

  if (intent === 'start_checkout') {
    if (!input.customerId) { yield { type: 'text', message: 'Para iniciar la compra, necesito identificarte.' }; return; }
    const r = await createOrderDraft({ customerId: input.customerId });
    if (!r.ok) { yield { type: 'text', message: r.error || 'No pude crear tu pedido.' }; return; }
    yield { type: 'text', message: 'Creé tu pedido. Te enviaré un código de confirmación por WhatsApp.' };
    await generateConfirmationToken({ orderId: r.order.id });
    yield { type: 'text', message: 'Cuando tengas el código, dímelo aquí para continuar.' };
    return;
  }

  if (intent === 'confirm_order') {
    const token = (text.match(/(\d{6})/) || [])[1];
    if (!token) { yield { type: 'text', message: 'Por favor indícame el código de 6 dígitos.' }; return; }
    // naive: last order of customer
    if (!input.customerId) { yield { type: 'text', message: 'Necesito identificarte para validar el pedido.' }; return; }
    // Fetch latest order id
    const orderId = 'latest'; // handled within validate tool in a more robust system
    const ok = await validateConfirmationToken({ orderId: (r as any)?.orderId || orderId, token }).catch(()=>({ ok:false }));
    if (!(ok as any).ok) { yield { type: 'text', message: (ok as any).error || 'Token inválido.' }; return; }
    yield { type: 'text', message: '¡Perfecto! Tu pedido está listo para pago.' };
    const pay = await initiateManualPayment({ orderId: (r as any)?.orderId || orderId });
    yield { type: 'rich', message: 'Opciones de pago:', order: pay };
    return;
  }

  if (intent === 'init_payment') {
    yield { type: 'text', message: 'Te enviaré las instrucciones de pago. Luego podrás reportar el pago con referencia.' };
    const pay = await initiateManualPayment({ orderId: 'latest' });
    yield { type: 'rich', message: 'Métodos e instrucciones de pago:', order: pay };
    return;
  }

  // Smalltalk / fallback
  yield { type: 'text', message: 'Claro, ¿qué producto buscas o qué necesitas hacer? Puedo ayudarte a encontrar, agregar al carrito y completar tu compra.' };
}

