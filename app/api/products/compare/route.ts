import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSettings } from '@/server/actions/settings';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const schema = z.object({
      lines: z.array(z.object({
        name: z.string().min(1),
        code: z.string().optional().nullable(),
        sku: z.string().optional().nullable(),
        barcode: z.string().optional().nullable(),
        stock: z.coerce.number().optional(),
        costUSD: z.coerce.number().optional(),
        brand: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        categorySlug: z.string().optional().nullable(),
        supplierId: z.string().optional().nullable(),
        images: z.array(z.string()).optional(),
      })).min(1),
    });
    const body = schema.parse(await req.json());
    const settings = await getSettings();
    const defClient = Number((settings as any).defaultMarginClientPct ?? 40);
    const defAlly = Number((settings as any).defaultMarginAllyPct ?? 30);
    const defWholesale = Number((settings as any).defaultMarginWholesalePct ?? 20);

    const out: any[] = [];
    for (const l of body.lines) {
      const code = (l.code || '').trim();
      const sku = (l.sku || '').trim();
      const barcode = (l.barcode || '').trim();
      const name = String(l.name).trim();
      let product: any = null;
      if (code || sku || barcode) {
        const digits = barcode.replace(/\D/g, '') || code.replace(/\D/g,'') || sku.replace(/\D/g,'');
        product = await prisma.product.findFirst({
          where: { OR: [
            ...(code ? [{ code }] : []),
            ...(sku ? [{ sku }] : []),
            ...(digits && digits.length >= 6 ? [{ barcode: digits }] : []),
          ] },
          select: { id: true, marginClientPct: true, marginAllyPct: true, marginWholesalePct: true },
        });
      }
      if (!product) {
        product = await prisma.product.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true, marginClientPct: true, marginAllyPct: true, marginWholesalePct: true } });
      }
      const marginClient = product?.marginClientPct ? Number(product.marginClientPct) : defClient;
      const marginAlly = product?.marginAllyPct ? Number(product.marginAllyPct) : defAlly;
      const marginWholesale = product?.marginWholesalePct ? Number(product.marginWholesalePct) : defWholesale;

      const costUSD = typeof l.costUSD === 'number' ? Number(l.costUSD) : undefined;
      const priceClientUSD = typeof costUSD === 'number' ? Number((costUSD * (1 + marginClient/100)).toFixed(2)) : undefined;
      const priceAllyUSD = typeof costUSD === 'number' ? Number((costUSD * (1 + marginAlly/100)).toFixed(2)) : undefined;
      const priceWholesaleUSD = typeof costUSD === 'number' ? Number((costUSD * (1 + marginWholesale/100)).toFixed(2)) : undefined;

      out.push({
        input: l,
        name,
        code: code || null,
        sku: sku || null,
        barcode: barcode || null,
        stock: l.stock ?? 0,
        costUSD,
        brand: l.brand || null,
        description: l.description || null,
        categorySlug: l.categorySlug || null,
        supplierId: l.supplierId || null,
        images: l.images || [],
        product,
        marginClientPct: marginClient,
        marginAllyPct: marginAlly,
        marginWholesalePct: marginWholesale,
        priceClientUSD,
        priceAllyUSD,
        priceWholesaleUSD,
        accion: product ? 'ACTUALIZAR' : 'CREAR',
      });
    }
    return NextResponse.json({ items: out });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

