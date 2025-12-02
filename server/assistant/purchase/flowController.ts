import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export type FlowResult = { messages: any[]; uiActions?: any[]; audioUrl?: string };

export async function runPurchaseConversation({
  customerId,
  sessionId,
  message,
}: {
  customerId?: string;
  sessionId?: string;
  message: string;
}): Promise<FlowResult> {
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
  const intentRes = await fetch(intentUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  })
    .then((r) => r.json())
    .catch(() => ({ intent: 'search', entities: {} }));

  const intent = String(intentRes?.intent || 'search');
  const entities = intentRes?.entities || {};

  // Saludo general / inicio de conversación
  if (intent === 'greet') {
    let name: string | undefined;
    try {
      if (customerId) {
        const user = await prisma.user.findUnique({
          where: { id: customerId },
          select: { name: true },
        });
        name = (user?.name || '').trim() || undefined;
      }
    } catch {
      // ignore lookup errors
    }
    const saludoBase = name ? `Hola, ${name}.` : 'Hola.';
    const texto = [
      saludoBase,
      'Soy tu asistente Carpihogar. Puedo ayudarte a buscar productos, agregarlos al carrito, comparar opciones y acompañarte hasta el pago.',
      'También puedo guiarte a experiencias como el personalizador de muebles y el Moodboard para armar tus proyectos.',
      '¿En qué te ayudo hoy?',
    ].join(' ');
    return {
      messages: [
        {
          role: 'assistant',
          type: 'text',
          content: texto,
        },
      ],
    } as any;
  }

  // Ayuda sobre secciones / funcionalidades del sitio (links directos)
  if (intent === 'site_help') {
    const section = String(entities?.section || '').toLowerCase();
    const urlFor = (path: string) => {
      try {
        return new URL(path, base).toString();
      } catch {
        return path;
      }
    };

    let content = '';
    if (section === 'moodboard') {
      content =
        'Puedes crear y guardar Moodboards desde la sección Moodboard. Ahí combinas productos, imágenes e ideas en un mismo tablero. Entra aquí: ' +
        urlFor('/moodboard');
    } else if (section === 'personalizador') {
      content =
        'Para personalizar muebles (medidas, colores, componentes) usa nuestro personalizador ECPD. Primero eliges el modelo y luego lo ajustas a tu proyecto. Puedes abrirlo aquí: ' +
        urlFor('/personalizar-muebles');
    } else if (section === 'cart') {
      content =
        'Tu carrito completo lo ves en /carrito y desde ahí puedes revisar productos y avanzar al pago. Si quieres, también puedo mostrarte un resumen desde aquí y luego llevarte a: ' +
        urlFor('/checkout/revisar');
    } else if (section === 'home') {
      content =
        'La página de inicio la tienes aquí: ' +
        urlFor('/') +
        '. Ahí verás destacados, novedades y accesos rápidos a experiencias como Moodboard y el personalizador de muebles.';
    } else if (section === 'novedades') {
      content =
        'Para ver las novedades y lanzamientos recientes, puedes visitar: ' +
        urlFor('/novedades') +
        '. Ahí encontrarás ideas nuevas y productos destacados.';
    } else if (section === 'contacto') {
      content =
        'Si quieres hablar con el equipo o enviar una consulta más formal, puedes usar la página de contacto: ' +
        urlFor('/contacto') +
        '. Igual, aquí mismo puedo ayudarte con dudas rápidas de productos o compras.';
    } else {
      content =
        'Puedo ayudarte a navegar por el sitio: Moodboard, personalizador de muebles, carrito, novedades, contacto y más. Dime qué quieres hacer y te indico el mejor camino.';
    }

    return {
      messages: [
        {
          role: 'assistant',
          type: 'text',
          content,
        },
      ],
    } as any;
  }

  if (intent === 'search') {
    // Sin intención clara de compra: dejamos que /api/assistant/text use el fallback de búsqueda de productos
    return { messages: [], uiActions: [] } as any;
  }

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
    if (!customerId) {
      return {
        messages: [
          {
            role: 'assistant',
            type: 'text',
            content: 'Necesito tu sesión para confirmar la compra.',
          },
        ],
      } as any;
    }
    return await handleConfirmOrder({ customerId, token });
  }

  // Default: guía suave sin forzar dirección ni pago todavía
  return {
    messages: [
      {
        role: 'assistant',
        type: 'text',
        content: 'Te ayudo con tu compra. ¿Qué producto deseas?',
      },
    ],
  } as any;
}

