import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const text = String(body?.text || '').trim();
    if (!text) return NextResponse.json({ error: 'text requerido' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY || '';
    if (apiKey) {
      const sys = `Eres un extractor de intención de compra.
Devuelve SOLO un JSON con:
{
  "intent": "add_to_cart"|"remove_from_cart"|"buy"|"set_address"|"set_payment"|"confirm"|"search",
  "entities": { "productName"?: string, "quantity"?: number, "addressId"?: string, "paymentMethod"?: string, "color"?: string, "model"?: string }
}
Si no es claro, usa intent "search" y entities vacíos.`;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: text },
          ],
          temperature: 0.2,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content || '{}';
        try {
          const parsed = JSON.parse(content);
          return NextResponse.json(parsed);
        } catch {}
      }
    }

    const low = text.toLowerCase();
    let intent: any = 'search';

    if (/agrega|añade|anade|meter|pon|agregar|añadir/.test(low)) intent = 'add_to_cart';
    if (/quitar|remueve|elimina|saca/.test(low)) intent = 'remove_from_cart';
    if (/comprar|cómpralo|lo quiero|quiero comprar|proceder al pago|ir a pagar|pagar ahora|finalizar compra/.test(low)) intent = 'buy';
    if (/direcci[oó]n|env[ií]alo a|enviar a/.test(low)) intent = 'set_address';
    if (/pago|pagar|m[eé]todo de pago|zelle|transferencia|pago m[oó]vil/.test(low)) intent = 'set_payment';
    if (/s[ií] autorizo|confirmar/.test(low)) intent = 'confirm';

    const quantityMatch = low.match(/(\d{1,2})\s*(u|unidades|uds|unidad)?/);
    const entities: any = {};
    if (quantityMatch) entities.quantity = parseInt(quantityMatch[1], 10);
    const prod = low.replace(/(comprar|agrega|añade|anade|meter|pon|quiero|deseo)/g, '').trim();
    if (prod.split(' ').length >= 1) entities.productName = prod;
    return NextResponse.json({ intent, entities });
  } catch (e: any) {
    return NextResponse.json({ error: 'intent error' }, { status: 200 });
  }
}

