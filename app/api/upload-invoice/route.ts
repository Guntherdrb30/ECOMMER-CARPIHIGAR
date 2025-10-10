import { NextResponse } from 'next/server';
import { callOpenAIResponses, ParsedInvoice } from '@/lib/openai';
import prisma from '@/lib/prisma';

export const maxDuration = 60; // allow some time for OCR

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const currency = String(form.get('currency') || 'USD').toUpperCase();
    const tasaInput = form.get('tasaVES');
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });

    // Get default tasa from settings if not provided
    let tasaVES = Number(tasaInput ?? 0);
    if (!tasaVES || isNaN(tasaVES)) {
      try {
        const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
        tasaVES = Number(settings?.tasaVES || 0);
      } catch {}
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const filename = (file as any)?.name ? String((file as any).name).toLowerCase() : '';
    const contentType = (file as any)?.type ? String((file as any).type).toLowerCase() : '';
    let parsed: ParsedInvoice | null = null;

    // Try OpenAI structured parsing first (if configured)
    try {
      const hasKey = !!process.env.OPENAI_API_KEY;
      if (hasKey) {
        // Use text-only fallback if file ingestion is not available
        let textContent = '';
        try {
          const pdfParse = await (async () => {
            try {
              const m: any = await import('pdf-parse');
              return m.default || m;
            } catch {
              return null;
            }
          })();
          if (pdfParse) {
            const out = await pdfParse(buf);
            textContent = out?.text || '';
          }
        } catch {}

        const schema = {
          name: 'parsed_invoice',
          schema: {
            type: 'object',
            properties: {
              currency: { type: 'string', enum: ['USD', 'VES'] },
              tasaVES: { type: 'number' },
              lines: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    name: { type: 'string' },
                    quantity: { type: 'number' },
                    unitCost: { type: 'number' },
                    total: { type: 'number' },
                  },
                  required: ['name', 'quantity', 'unitCost'],
                  additionalProperties: false,
                },
              },
            },
            required: ['currency', 'lines'],
            additionalProperties: false,
          },
        } as const;

        const resp = await callOpenAIResponses({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_schema', json_schema: schema as any },
          input: [
            { role: 'system', content: 'Extrae líneas de una factura de proveedor. Devuelve JSON estricto con currency, tasaVES (si aparece), y lines.' },
            { role: 'user', content: `Texto extraído del PDF (si está disponible):\n${textContent.slice(0, 10000)}` },
          ],
        });
        const content = (resp as any)?.output?.[0]?.content?.[0]?.text || (resp as any)?.output_text || (resp as any)?.content || '';
        try {
          const data = JSON.parse(content);
          if (data && Array.isArray(data?.lines)) {
            parsed = {
              currency: (String(data.currency || currency).toUpperCase() === 'VES' ? 'VES' : 'USD') as 'USD' | 'VES',
              tasaVES: Number(data.tasaVES || tasaVES || 0) || undefined,
              lines: data.lines.map((l: any) => ({
                code: l.code || null,
                name: String(l.name || '').slice(0, 200),
                quantity: Number(l.quantity || 0),
                unitCost: Number(l.unitCost || 0),
                total: Number(l.total || 0) || undefined,
              })),
            };
          }
        } catch {}
      }
    } catch {}

    // CSV/TXT parser (simple columns: code,name,quantity,unitCost[,total])
    if (!parsed && (filename.endsWith('.csv') || filename.endsWith('.txt') || contentType.includes('csv') || contentType.includes('text/plain'))) {
      try {
        const text = buf.toString('utf8');
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const out: any[] = [];
        let header: string[] | null = null;
        if (lines.length) {
          const first = lines[0].split(/[;,\t]/).map(s => s.trim().toLowerCase());
          const hasHeader = first.some(h => ['code','codigo','sku','name','producto','cantidad','quantity','unitcost','costo','precio'].includes(h));
          if (hasHeader) {
            header = first;
            lines.shift();
          }
        }
        for (const raw of lines) {
          const cols = raw.split(/[;,\t]/).map(s => s.trim());
          let code: string | null = null;
          let name = '';
          let quantity = 0;
          let unitCost = 0;
          if (header) {
            const h = header;
            const idx = (key: string, alts: string[]) => h.findIndex(x => x === key || alts.includes(x));
            const iCode = idx('code', ['codigo','sku','código']);
            const iName = idx('name', ['producto','nombre','descripcion','descripción']);
            const iQty = idx('quantity', ['cantidad','qty']);
            const iUnit = idx('unitcost', ['costo','precio','unit_price','unitprice','unit']);
            if (iCode >= 0) code = cols[iCode] || null;
            if (iName >= 0) name = cols[iName] || '';
            if (iQty >= 0) quantity = Number(String(cols[iQty] || '0').replace(',','.')) || 0;
            if (iUnit >= 0) unitCost = Number(String(cols[iUnit] || '0').replace(',','.')) || 0;
          } else {
            const nums = cols.map((v, i) => ({ i, n: Number(String(v).replace(',','.')) }));
            const idxs = nums.filter(x => !isNaN(x.n) && x.n > 0).map(x => x.i);
            if (idxs.length >= 2) {
              const iQty = idxs[0];
              const iUnit = idxs[idxs.length - 1];
              quantity = Number(String(cols[iQty]).replace(',','.')) || 0;
              unitCost = Number(String(cols[iUnit]).replace(',','.')) || 0;
              const nameParts = cols.filter((_, j) => j !== iQty && j !== iUnit);
              name = nameParts.join(' ').slice(0, 200);
              code = (cols[0] && cols[0].length <= 16 && isNaN(Number(cols[0])) ? cols[0] : null) as any;
            } else {
              continue;
            }
          }
          if (name && quantity > 0 && unitCost > 0) out.push({ code, name, quantity, unitCost });
        }
        parsed = { currency: (currency === 'VES' ? 'VES' : 'USD') as any, tasaVES: tasaVES || undefined, lines: out };
      } catch {}
    }

    // Fallback naive PDF text parsing (if pdf-parse installed)
    if (!parsed) {
      try {
        const pdfParse = await (async () => {
          try {
            const m: any = await import('pdf-parse');
            return m.default || m;
          } catch {
            return null;
          }
        })();
        if (pdfParse) {
          const out = await pdfParse(buf);
          const text: string = out?.text || '';
          const lines: any[] = [];
          for (const raw of text.split(/\r?\n/)) {
            const line = raw.trim();
            if (!line) continue;
            // Heurística simple: nombre .... qty x price = total
            const qtyPrice = line.match(/(\d+)\s+x\s+(\d+[\.,]?\d*)/i);
            if (qtyPrice) {
              const quantity = Number(qtyPrice[1]);
              const unitCost = Number(String(qtyPrice[2]).replace(',', '.'));
              const name = line.replace(qtyPrice[0], '').replace(/[-–—·••\*]+/g, ' ').trim().slice(0, 200);
              if (quantity > 0 && unitCost > 0 && name) lines.push({ name, quantity, unitCost });
            } else {
              // Heurística adicional: tokens separados por espacios/tabs con cantidad y precio
              const tokens = line.split(/\s{2,}|\t|\s-\s/).map(t => t.trim()).filter(Boolean);
              const nums = tokens.map(t => Number(String(t).replace(',','.')));
              const qtyIdx = nums.findIndex(n => !isNaN(n) && Number.isFinite(n) && Math.floor(n) === n && n > 0);
              const priceIdx = (() => {
                const rev = [...nums].map((n, i) => ({ n, i })).reverse();
                const found = rev.find(x => !isNaN(x.n) && x.n > 0);
                return found ? found.i : -1;
              })();
              if (qtyIdx >= 0 && priceIdx >= 0 && priceIdx !== qtyIdx) {
                const quantity = Number(String(tokens[qtyIdx]).replace(',','.'));
                const unitCost = Number(String(tokens[priceIdx]).replace(',','.'));
                const name = tokens.filter((_, i) => i !== qtyIdx && i !== priceIdx).join(' ').slice(0, 200);
                if (name && quantity > 0 && unitCost > 0) lines.push({ name, quantity, unitCost });
              }
            }
          }
          parsed = { currency: (currency === 'VES' ? 'VES' : 'USD') as any, tasaVES: tasaVES || undefined, lines };
        }
      } catch {}
    }

    // Last resort: minimal placeholder
    if (!parsed) {
      parsed = {
        currency: (currency === 'VES' ? 'VES' : 'USD') as any,
        tasaVES: tasaVES || undefined,
        lines: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error al procesar la factura' }, { status: 500 });
  }
}

