import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { log } from '../../utils/logger';
import { safeQuery } from '../../utils/db';

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

async function personaText(): Promise<string> {
  try {
    const p1 = path.join(__dirname, '../../persona.md');
    if (fs.existsSync(p1)) return fs.readFileSync(p1, 'utf-8');
  } catch {}
  try {
    const p2 = path.join(process.cwd(), 'agents/carpihogar-customer-assistant/persona.md');
    if (fs.existsSync(p2)) return fs.readFileSync(p2, 'utf-8');
  } catch {}
  return [
    'Eres Carpihogar Asistente, asesora de ventas. Responde siempre en español con tono cálido, útil y profesional.',
    'No inventes precios ni stock. Si algo no está claro, pide una aclaración breve.',
    'Usa las herramientas disponibles para buscar productos, gestionar el carrito y pagos; mantén las respuestas en 1–3 frases, con pregunta de seguimiento cuando aporte valor.'
  ].join('\n');
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

function toolSpecs() {
  return [
    {
      type: 'function',
      function: {
        name: 'search_products',
        description: 'Buscar productos en el catálogo por términos de consulta.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_product_details',
        description: 'Obtener detalle de un producto por ID.',
        parameters: {
          type: 'object',
          properties: { productId: { type: 'string' } },
          required: ['productId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'add_to_cart',
        description: 'Agregar un producto al carrito. Requiere cliente identificado.',
        parameters: {
          type: 'object',
          properties: { productId: { type: 'string' }, qty: { type: 'number' } },
          required: ['productId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'remove_from_cart',
        description: 'Quitar un producto del carrito. Requiere cliente identificado.',
        parameters: {
          type: 'object',
          properties: { productId: { type: 'string' } },
          required: ['productId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'view_cart',
        description: 'Ver el carrito actual. Requiere cliente identificado.',
        parameters: { type: 'object', properties: {}, required: [] }
      }
    },
    {
      type: 'function',
      function: {
        name: 'create_order_draft',
        description: 'Crear un pedido borrador desde el carrito.',
        parameters: { type: 'object', properties: {}, required: [] }
      }
    },
    {
      type: 'function',
      function: {
        name: 'generate_confirmation_token',
        description: 'Generar y enviar token de confirmación para un pedido.',
        parameters: {
          type: 'object',
          properties: { orderId: { type: 'string' } },
          required: ['orderId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'validate_confirmation_token',
        description: 'Validar token de confirmación del pedido más reciente en estado pendiente.',
        parameters: {
          type: 'object',
          properties: { token: { type: 'string' } },
          required: ['token']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'initiate_payment',
        description: 'Iniciar proceso de pago para el pedido más reciente o uno específico.',
        parameters: {
          type: 'object',
          properties: { orderId: { type: 'string' }, method: { type: 'string' } },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'submit_payment',
        description: 'Registrar/Reportar un pago con método, monto y referencia.',
        parameters: {
          type: 'object',
          properties: {
            amountUSD: { type: 'number' },
            method: { type: 'string' },
            reference: { type: 'string' }
          },
          required: ['method']
        }
      }
    }
  ];
}

export async function* sendMessage(input: { text: string; customerId?: string }) {
  const userText = String(input.text || '').trim();
  log('assistant.intent', { text: userText });

  if (!userText) {
    yield { type: 'text', message: '¡Hola! Soy tu asistente de Carpihogar. ¿En qué puedo ayudarte hoy?' };
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    yield { type: 'text', message: '¡Hola! Para una asistencia más humana con IA necesito la clave OPENAI_API_KEY configurada. Mientras tanto, dime qué producto buscas y trataré de ayudarte.' };
    return;
  }

  // Memoria por cliente (si hay sesión)
  let conversationId: string | null = null;
  let priorMessages: Array<{ role: 'user'|'assistant'; content: string }> = [];
  try {
    if (input.customerId) {
      const phoneKey = `web:${input.customerId}`.slice(0, 50);
      let convo = await prisma.conversation.findFirst({ where: { phone: phoneKey } });
      if (!convo) {
        convo = await prisma.conversation.create({ data: { phone: phoneKey, userId: input.customerId, aiHandled: true, lastMessageAt: new Date() } });
      }
      conversationId = convo.id;
      const recent = await prisma.message.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: 'asc' }, take: 30 });
      priorMessages = recent.map((m: any) => ({ role: (m.direction === 'IN' ? 'user' : 'assistant') as ('user'|'assistant'), content: String(m.text || '') })).filter(m => !!m.content);
      await prisma.message.create({ data: { conversationId: convo.id, direction: 'IN' as any, status: 'SENT' as any, type: 'TEXT', text: userText, actor: 'CUSTOMER' as any } });
      try { await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastInboundAt: new Date(), aiHandled: true } }); } catch {}
    }
  } catch (e) {
    log('assistant.memory_init.error', { error: String(e) });
  }
  const tools = toolSpecs();
  const sys = await personaText();

  const messages: Array<any> = [
    { role: 'system', content: sys },
    { role: 'system', content: [
      'Estrategia:',
      '- Usa herramientas para operaciones de ecommerce (buscar, carrito, pedido, pagos).',
      '- Si el usuario solo saluda, responde con un saludo corto y una pregunta de descubrimiento.',
      '- Mantén respuestas en 1–3 frases, en español, con un tono cálido y útil.',
      '- Antes de usar herramientas que requieren identificación, verifica si hay clienteId; si falta, pide identificación de forma amable.',
      '- Tras usar herramientas, explica el siguiente paso (p. ej., “¿Deseas agregar X al carrito?”).'
    ].join('\n') },
    ...priorMessages,    { role: 'user', content: userText }
  ];
  // Refuerzo para activar búsqueda ante marcas o tipos de producto
  messages.push({ role: 'system', content: 'Si el texto parece marca o tipo de producto ("samet", "bisagras", "bisagra cierre lento"), usa search_products con ese texto.' });

  const callOpenAI = async () => {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, tools, tool_choice: 'auto', temperature: 0.6 })
    });
    if (!resp.ok) throw new Error(`OpenAI error ${resp.status}`);
    const data: any = await resp.json();
    const choice = data?.choices?.[0];
    return choice?.message as any;
  };

  const pendingChunks: AssistantChunk[] = [];
  const runTool = async (name: string, args: any) => {
    try {
      switch (name) {
        case 'search_products': {
          const list = await searchProducts(String(args?.query || ''));
          if (Array.isArray(list) && list.length) {
            pendingChunks.push({ type: 'rich', message: 'Estos productos podrían interesarte:', products: list } as any);
          }
          return { ok: true, products: list };
        }
        case 'get_product_details': {
          const detail = await getProductDetails(String(args?.productId || ''));
          if (detail) {
            pendingChunks.push({ type: 'rich', message: 'Aquí tienes los detalles:', products: [detail] } as any);
          }
          return { ok: !!detail, product: detail };
        }
        case 'view_cart': {
          if (!input.customerId) return { ok: false, error: 'Se requiere identificación para ver el carrito.' };
          const cart = await viewCart({ customerId: input.customerId });
          pendingChunks.push({ type: 'rich', message: 'Tu carrito actual:', cart: cart.cart } as any);
          return { ok: true, cart: cart.cart };
        }
        case 'add_to_cart': {
          if (!input.customerId) return { ok: false, error: 'Se requiere identificación para agregar al carrito.' };
          const pid = String(args?.productId || '');
          const qty = Math.max(1, Number(args?.qty || 1));
          await addToCart({ customerId: input.customerId, productId: pid, qty });
          const cart = await viewCart({ customerId: input.customerId });
          pendingChunks.push({ type: 'rich', message: 'Producto agregado. Así va tu carrito:', cart: cart.cart } as any);
          return { ok: true, cart: cart.cart };
        }
        case 'remove_from_cart': {
          if (!input.customerId) return { ok: false, error: 'Se requiere identificación para quitar del carrito.' };
          const pid = String(args?.productId || '');
          await removeFromCart({ customerId: input.customerId, productId: pid });
          const cart = await viewCart({ customerId: input.customerId });
          pendingChunks.push({ type: 'rich', message: 'Producto eliminado. Tu carrito ahora:', cart: cart.cart } as any);
          return { ok: true, cart: cart.cart };
        }
        case 'create_order_draft': {
          if (!input.customerId) return { ok: false, error: 'Se requiere identificación para crear pedido.' };
          const r = await createOrderDraft({ customerId: input.customerId });
          if (!r.ok) return { ok: false, error: r.error };
          return { ok: true, order: r.order };
        }
        case 'generate_confirmation_token': {
          const orderId = String(args?.orderId || '');
          if (!orderId) return { ok: false, error: 'orderId requerido' };
          const r = await generateConfirmationToken({ orderId });
          return { ok: !!(r as any)?.ok };
        }
        case 'validate_confirmation_token': {
          if (!input.customerId) return { ok: false, error: 'Se requiere identificación para validar token.' };
          const token = String(args?.token || '');
          const orderId = await latestOrderId(input.customerId, ['pending_confirmation']);
          if (!orderId) return { ok: false, error: 'No hay pedido pendiente de confirmación.' };
          const r = await validateConfirmationToken({ orderId, token });
          return { ok: !!(r as any)?.ok };
        }
        case 'initiate_payment': {
          if (!input.customerId) return { ok: false, error: 'Se requiere identificación para iniciar pago.' };
          const orderId = String(args?.orderId || '') || await latestOrderId(input.customerId, ['awaiting_payment', 'payment_pending_review']) || '';
          if (!orderId) return { ok: false, error: 'No hay pedido listo para pago.' };
          const pay = await initiateManualPayment({ orderId, method: args?.method });
          pendingChunks.push({ type: 'rich', message: 'Métodos e instrucciones de pago:', order: pay } as any);
          return { ok: true, order: pay };
        }
        case 'submit_payment': {
          if (!input.customerId) return { ok: false, error: 'Se requiere identificación para reportar pago.' };
          const orderId = await latestOrderId(input.customerId, ['awaiting_payment', 'payment_pending_review']);
          if (!orderId) return { ok: false, error: 'No encuentro un pedido para registrar pago.' };
          const amount = args?.amountUSD != null ? Number(args.amountUSD) : undefined;
          const r = await submitManualPayment({ orderId, method: String(args?.method || ''), amountUSD: amount || 0, reference: args?.reference });
          return { ok: !!r.ok };
        }
        default:
          return { ok: false, error: `Herramienta desconocida: ${name}` };
      }
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) };
    }
  };

  // Bucle de herramienta -> respuesta final
  try {
    for (let step = 0; step < 6; step++) {
      const msg: any = await callOpenAI();
      if (msg?.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
        // Incluye el mensaje del asistente con tool_calls en el historial
        messages.push({ role: 'assistant', content: msg.content ?? '', tool_calls: msg.tool_calls });
        for (const tc of msg.tool_calls) {
          const name = tc?.function?.name as string;
          let args: any = {};
          try { args = JSON.parse(tc?.function?.arguments || '{}'); } catch {}
          const result = await runTool(name, args);
          messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
        }
        // Continua el loop para permitir que el modelo formule la respuesta final
        continue;
      }
      // Sin herramientas: devolver respuesta final
      const content: string = String(msg?.content || '').trim();
      const hasProducts = pendingChunks.some((c: any) => Array.isArray((c as any)?.products) && (c as any).products.length > 0);
      const hasCartOrOrder = pendingChunks.some((c: any) => (c as any)?.cart || (c as any)?.order);
      for (const ch of pendingChunks) yield ch;
      if (!hasProducts && !hasCartOrOrder) {
        if (content) yield { type: 'text', message: content };
        else yield { type: 'text', message: '¿Te ayudo a buscar un producto o gestionar tu carrito?' };
      }
      return;
    }
    // Si excede el máximo de pasos
    const hasProducts = pendingChunks.some((c: any) => Array.isArray((c as any)?.products) && (c as any).products.length > 0);
    for (const ch of pendingChunks) yield ch;
    if (!hasProducts) {
      yield { type: 'text', message: 'Puedo ayudarte a buscar productos o avanzar con tu compra. ¿Qué necesitas?' };
    }
  } catch (error) {
    log('assistant.error', { error: String(error) });
    yield { type: 'text', message: 'Lo siento, tuve un problema al procesar tu solicitud. ¿Probamos buscando un producto?' };
  }
}

