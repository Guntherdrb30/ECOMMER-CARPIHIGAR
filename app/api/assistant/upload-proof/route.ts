import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { safeQuery } from '@/agents/carpihogar-customer-assistant/utils/db';
import { submitManualPayment } from '@/agents/carpihogar-customer-assistant/tools/orders/submitManualPayment';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function latestOrderId(customerId: string): Promise<string | null> {
  // Busca la última orden en estados de pago activos en la tabla "orders" (DB raw)
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(customerId);
  const statuses = ['awaiting_payment','payment_pending_review','pending_confirmation'];
  let sql: string;
  let params: any[];
  if (isUuid) {
    sql = `select o.id from orders o where o.customer_id = $1 and o.status = any($2) order by o.created_at desc limit 1`;
    params = [customerId, statuses];
  } else {
    sql = `select o.id from orders o join customers c on c.id = o.customer_id where c.external_id = $1 and o.status = any($2) order by o.created_at desc limit 1`;
    params = [customerId, statuses];
  }
  try {
    const r = await safeQuery(sql, params);
    return (r.rows[0] as any)?.id || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id as string | undefined;
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ ok: false, error: 'Archivo de imagen requerido' }, { status: 400 });

    const arrayBuf = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString('base64');
    const mime = (file as any)?.type || 'image/jpeg';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY no configurada' }, { status: 500 });

    const sys = 'Eres un asistente que extrae datos de soportes de pago. Devuelve SOLO JSON con: method ("Zelle"|"Pago Móvil"|"Transferencia Bancaria"), currency ("USD"|"VES"), amountUSD (número, si aplica), amountVES (número, si aplica), reference (string).';
    const body = {
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: sys },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Lee la imagen y devuelve SOLO JSON válido con los campos solicitados.' },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
          ] as any,
        },
      ],
    } as any;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ ok: false, error: `OpenAI error ${resp.status}: ${txt}` }, { status: 500 });
    }
    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content || '';
    let parsed: any = null;
    try { parsed = JSON.parse(content); } catch {}
    if (!parsed || typeof parsed !== 'object') return NextResponse.json({ ok: false, error: 'No pude extraer datos del soporte.' }, { status: 200 });

    const rawMethod = String(parsed.method || '').toLowerCase();
    const method = /zelle/.test(rawMethod) ? 'Zelle' : (/m[óo]vil/.test(rawMethod) ? 'Pago Móvil' : 'Transferencia Bancaria');
    const currency = String(parsed.currency || '').toUpperCase() === 'VES' ? 'VES' : 'USD';
    const amountUSDFromJson = Number(parsed.amountUSD || 0) || 0;
    const amountVESFromJson = Number(parsed.amountVES || 0) || 0;
    let amountUSD = amountUSDFromJson;
    if ((!amountUSD || amountUSD <= 0) && amountVESFromJson > 0) {
      try {
        const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
        const tasa = Number(settings?.tasaVES || 0) || 0;
        if (tasa > 0) amountUSD = amountVESFromJson / tasa;
      } catch {}
    }
    amountUSD = Number(amountUSD.toFixed(2));
    const reference = String(parsed.reference || '').slice(0, 80) || undefined;

    let submitted: any = { ok: false };
    if (customerId) {
      const orderId = await latestOrderId(customerId);
      if (orderId && amountUSD > 0) {
        submitted = await submitManualPayment({ orderId, method, amountUSD, reference });
      }
    }

    return NextResponse.json({ ok: true, parsed: { method, currency, amountUSD, reference }, submitted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

