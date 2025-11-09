import { log } from '../../utils/logger';
import { safeQuery } from '../../utils/db';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
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
  if (/compra\s+anterior|pedido\s+anterior|repetir|repite|lo\s+mismo|me\s+falt[óo]/.test(t)) return 'reorder_last';
  if (/detalle|detalles|ver\s+producto/.test(t)) return 'product_detail';
  if (/comprar|iniciar\s+compra|hacer\s+pedido|proceder\s+a\s+pagar|ir\s+a\s+pagar/.test(t)) return 'start_checkout';
  if (/token|confirmar|código|codigo/.test(t)) return 'confirm_order';
  if (/pago|pagar|transferencia|zelle|cele|pago móvil|pago movil|punto/.test(t)) return 'init_payment';
  if (/(reportar|subir)\s+pago|comprobante|referencia/.test(t)) return 'report_payment';
  return 'smalltalk';
}

export async function* sendMessage(input: { text: string; customerId?: string }) {
  const text = String(input.text || '').trim();
  log('assistant.intent', { text });
  if (!text) { yield { type: 'text', message: '¿Puedes contarme qué estás buscando?' }; return; }
  const intent = detectIntent(text);

  async function resolveProductIdFromText(t: string): Promise<string | null> {
    const token = (t.match(/[a-z0-9\-_]{4,}/i) || [])[0];
    if (!token) return null;
    const byId = await prisma.product.findUnique({ where: { id: token }, select: { id: true } });
    if (byId?.id) return byId.id;
    const found = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: { equals: token, mode: 'insensitive' } },
          { sku: { equals: token, mode: 'insensitive' } },
          { name: { contains: token, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    return found?.id || null;
  }

  async function latestOrderId(customerId: string, statuses?: string[]): Promise<string | null> {
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(customerId);
    const statusCond = statuses && statuses.length ? 'and o.status = any($2)' : '';
    let sql: string;
    let params: any[];
    if (isUuid) {
      sql = `select o.id from orders o where o.customer_id = $1 ${statusCond} order by o.created_at desc limit 1`;
      params = [customerId];
      if (statusCond) params.push(statuses);
    } else {
      sql = `select o.id from orders o join customers c on c.id = o.customer_id where c.external_id = $1 ${statusCond} order by o.created_at desc limit 1`;
      params = [customerId];
      if (statusCond) params.push(statuses);
    }
    const r = await safeQuery(sql, params);
    return (r.rows[0] as any)?.id || null;
  }

  if (intent === 'search_products') {
    const products = await searchProducts(text);
    if (products.length) {
      yield { type: 'rich', message: 'Te recomiendo estos productos:', products } as any;
      try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
          const personaPath1 = path.join(__dirname, '../../persona.md');
          const personaPath2 = path.join(process.cwd(), 'agents/carpihogar-customer-assistant/persona.md');
          const persona = fs.existsSync(personaPath1)
            ? fs.readFileSync(personaPath1, 'utf-8')
            : (fs.existsSync(personaPath2) ? fs.readFileSync(personaPath2, 'utf-8') : 'Eres Carpihogar Asistente, asesora de ventas. Responde siempre en español con tono cálido, útil y profesional.');
          const names = products.slice(0, 6).map(p => ({ nombre: p.name, precioUSD: p.priceUSD })).filter(Boolean);
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              messages: [
                { role: 'system', content: persona },
                { role: 'user', content: 'Redacta un breve mensaje de asesoría de ventas (1-3 frases) para ayudar a elegir entre los productos listados. No inventes precios ni stock; usa solo el contexto y haz una pregunta para clarificar necesidad o cantidad.\n\nContexto (JSON): ' + JSON.stringify({ consulta: text, productos: names }).slice(0,4000) }
              ],
            }),
          });
          if (response.ok) {
            const data = await response.json();
            const pitch = (data as any)?.choices?.[0]?.message?.content as string | undefined;
            if (pitch) yield { type: 'text', message: pitch } as any;
          }
        }
      } catch {}
    } else {
      yield { type: 'text', message: 'No encontré productos con esa búsqueda. ¿Probamos con otro término?' };
    }
    return;
  }

  if (intent === 'reorder_last') {
    // Try to extract qty + terms (e.g., "dos bisagras")
    const qtyMatch = text.toLowerCase().match(/(\d+|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)/);
    const qtyMap: any = { uno:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, diez:10 };
    const qty = qtyMatch ? (isNaN(Number(qtyMatch[1])) ? qtyMap[qtyMatch[1]] : Number(qtyMatch[1])) : undefined;
    const terms = text.replace(/compra\s+anterior|pedido\s+anterior|repetir|repite|lo\s+mismo|me\s+falt[óo]|\b(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\b/gi,'').trim();
    const tool = (await import('../orders/reorderFromLast')).reorderFromLast;
    const r = await tool({ customerId: input.customerId, terms: terms || undefined, qty: qty || undefined });
    if (!r.ok) { yield { type: 'text', message: r.error || 'No pude reordenar. ¿Probamos indicando el producto?' }; return; }
    const cart = await viewCart({ customerId: input.customerId });
    yield { type: 'rich', cart: cart.cart, message: 'Cargué tu carrito con la compra anterior.' };
    yield { type: 'text', message: '¿Quieres proceder al pago?', actions: [ { key: 'start_checkout', label: 'Sí, pagar' } ] } as any;
    return;
  }

  if (intent === 'product_detail') {
    const tokenId = await resolveProductIdFromText(text);
    if (!tokenId) { yield { type: 'text', message: '¿Cuál producto quieres ver? Puedes darme el nombre, SKU o enlace.' }; return; }
    const p = await getProductDetails(tokenId).catch(() => null);
    if (!p) { yield { type: 'text', message: 'No pude obtener el detalle. ¿Puedes intentar con otro identificador?' }; return; }
    yield { type: 'rich', products: [p], message: 'Aquí tienes los detalles:' };
    return;
  }

  if (intent === 'add_to_cart') {
    const id = await resolveProductIdFromText(text);
    if (!id || !input.customerId) { yield { type: 'text', message: 'Para agregar, indícame el producto y asegúrate de estar identificado.' }; return; }
    await addToCart({ customerId: input.customerId, productId: id, qty: 1 });
    const cart = await viewCart({ customerId: input.customerId });
    yield { type: 'rich', cart: cart.cart, message: 'Listo, agregué el producto. Así va tu carrito:' };
    return;
  }

  if (intent === 'remove_from_cart') {
    const id = await resolveProductIdFromText(text);
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
    if (!input.customerId) { yield { type: 'text', message: 'Necesito identificarte para validar el pedido.' }; return; }
    const orderId = await latestOrderId(input.customerId, ['pending_confirmation']);
    if (!orderId) { yield { type: 'text', message: 'No tengo un pedido pendiente de confirmación. ¿Quieres que inicie uno?' }; return; }
    const ok = await validateConfirmationToken({ orderId, token }).catch(()=>({ ok:false }));
    if (!(ok as any).ok) { yield { type: 'text', message: (ok as any).error || 'Token inválido.' }; return; }
    yield { type: 'text', message: '¡Perfecto! Tu pedido está listo para pago.' };
    const pay = await initiateManualPayment({ orderId });
    yield { type: 'rich', message: 'Opciones de pago:', order: pay };
    return;
  }

  if (intent === 'init_payment') {
    if (!input.customerId) { yield { type: 'text', message: 'Necesito identificarte para continuar con el pago.' }; return; }
    const lower = text.toLowerCase();
    const hintZelle = /zelle|cele/.test(lower);
    const hintPm = /pago\s+m[óo]vil|pm/.test(lower);
    const hintTransfer = /transfer/.test(lower);
    const methodHint = hintZelle ? 'Zelle' : hintPm ? 'Pago Móvil' : hintTransfer ? 'Transferencia Bancaria' : undefined;
    // 1) ¿Ya hay pedido listo para pagar?
    let orderId = await latestOrderId(input.customerId, ['awaiting_payment','payment_pending_review']);
    if (!orderId) {
      // 2) ¿Hay pedido pendiente de confirmación? reenvía token
      const pendingId = await latestOrderId(input.customerId, ['pending_confirmation']);
      if (pendingId) {
        await generateConfirmationToken({ orderId: pendingId });
        yield { type: 'text', message: 'Reenvié el código de confirmación por WhatsApp. Dímelo aquí para continuar.' };
        return;
      }
      // 3) Crea pedido desde el carrito y envía token
      const draft = await createOrderDraft({ customerId: input.customerId });
      if (!draft.ok) { yield { type: 'text', message: draft.error || 'No pude crear tu pedido. ¿Tienes productos en el carrito?' }; return; }
      await generateConfirmationToken({ orderId: draft.order.id });
      yield { type: 'text', message: 'Te envié un código de confirmación por WhatsApp. Dímelo aquí para continuar con el pago.' };
      if (hintZelle) yield { type: 'text', message: 'Anotaré que deseas pagar por Zelle.' };
      return;
    }
    // 4) Ya está listo para pagar
    const pay = await initiateManualPayment({ orderId, method: methodHint });
    const msg = methodHint ? `Aquí están las instrucciones de ${methodHint}. Luego podrás reportar tu pago con referencia.` : '¿Cómo deseas pagar?';
    yield { type: 'text', message: msg, actions: methodHint ? undefined : [
      { key: 'choose_method_zelle', label: 'Zelle' },
      { key: 'choose_method_pm', label: 'Pago Móvil' },
      { key: 'choose_method_transfer', label: 'Transferencia' },
      { key: 'choose_method_store', label: 'En tienda' },
    ] } as any;
    yield { type: 'rich', message: methodHint ? undefined : 'Métodos e instrucciones de pago:', order: pay };
    return;
  }

  if (intent === 'report_payment') {
    if (!input.customerId) { yield { type: 'text', message: 'Necesito identificarte para asociar tu pago.' }; return; }
    const orderId = await latestOrderId(input.customerId, ['awaiting_payment','payment_pending_review']);
    if (!orderId) { yield { type: 'text', message: 'No encuentro un pedido para registrar pago. ¿Creamos uno?' }; return; }
    const lower = text.toLowerCase();
    const method = /zelle/.test(lower) ? 'Zelle' : /mó?vil/.test(lower) ? 'Pago Móvil' : /transfer/.test(lower) ? 'Transferencia Bancaria' : 'Transferencia Bancaria';
    const amountMatch = text.replace(/[,]/g,'.').match(/(\d+[\.]\d{1,2}|\d+)/);
    const amount = amountMatch ? Number(amountMatch[1]) : 0;
    const refMatch = text.match(/ref\w*[:\s-]*([A-Za-z0-9\-]+)/i) || text.match(/([A-Za-z0-9]{6,})$/);
    const reference = refMatch ? refMatch[1] : undefined;
    const r = await submitManualPayment({ orderId, method, amountUSD: amount, reference });
    if (r.ok) {
      yield { type: 'text', message: '¡Gracias! Registré tu pago. Estamos finalizando tu compra…' };
      // Opcional: marcar como completado y enviar recibo (placeholder)
      try { const { sendWhatsappMessage } = await import('../../utils/sendWhatsappMessage'); await sendWhatsappMessage(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '', 'Tu compra ha sido registrada. ¡Gracias!'); } catch {}
      yield { type: 'text', message: 'Tu orden ha sido finalizada. Recibirás tu recibo por WhatsApp.' };
    } else {
      yield { type: 'text', message: 'No pude registrar tu pago. ¿Puedes verificar la referencia o intentar de nuevo?' };
    }
    return;
  }

  // Smalltalk / fallback
  try {
    const persona = fs.readFileSync(path.join(__dirname, '../../persona.md'), 'utf-8');
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      yield { type: 'text', message: 'Por ahora no puedo conversar, pero puedo ayudarte a buscar productos o gestionar tu carrito.' } as any;
      return;
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: persona },
          { role: 'user', content: text },
        ],
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    const data: any = await response.json();
    const message = data?.choices?.[0]?.message?.content as string | undefined;
    yield { type: 'text', message: message || 'No sé qué decir a eso. ¿Puedes intentar de otra forma?' };
    return;
  } catch (error) {
    log('assistant.error.smalltalk', { error });
    // If LLM fails, provide a very basic fallback
    yield { type: 'text', message: 'Lo siento, estoy teniendo problemas para procesar tu solicitud. ¿Puedes intentar con una búsqueda de producto?' };
  }
}
