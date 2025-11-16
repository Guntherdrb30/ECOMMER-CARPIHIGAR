import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSettings } from '@/server/actions/settings';
import { z } from 'zod';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || ((session.user as any)?.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const schema = z.object({
      items: z.array(z.object({
        name: z.string().min(1),
        code: z.string().optional().nullable(),
        sku: z.string().optional().nullable(),
        barcode: z.string().optional().nullable(),
        stock: z.coerce.number().optional().default(0),
        costUSD: z.coerce.number().optional(),
        brand: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        categorySlug: z.string().optional().nullable(),
        supplierId: z.string().optional().nullable(),
        images: z.array(z.string()).optional().default([]),
      })).min(1),
    });
    const body = schema.parse(await req.json());
    const settings = await getSettings();
    const defClient = Number((settings as any).defaultMarginClientPct ?? 40);
    const defAlly = Number((settings as any).defaultMarginAllyPct ?? 30);
    const defWholesale = Number((settings as any).defaultMarginWholesalePct ?? 20);

    for (const it of body.items) {
      let product: any = null;
      const code = (it.code || '').trim();
      const sku = (it.sku || '').trim();
      const barcode = (it.barcode || '').trim();
      if (code || sku || barcode) {
        const digits = barcode.replace(/\D/g,'') || code.replace(/\D/g,'') || sku.replace(/\D/g,'');
        product = await prisma.product.findFirst({ where: { OR: [ ...(code ? [{ code }] : []), ...(sku ? [{ sku }] : []), ...(digits && digits.length>=6 ? [{ barcode: digits }] : []) ] } });
      }
      if (!product) {
        product = await prisma.product.findFirst({ where: { name: { equals: it.name, mode: 'insensitive' } } });
      }
      const marginClientPct = product?.marginClientPct ? Number(product.marginClientPct) : defClient;
      const marginAllyPct = product?.marginAllyPct ? Number(product.marginAllyPct) : defAlly;
      const marginWholesalePct = product?.marginWholesalePct ? Number(product.marginWholesalePct) : defWholesale;
      const costUSD = typeof it.costUSD === 'number' ? Number(it.costUSD) : undefined;
      const priceClientUSD = typeof costUSD === 'number' ? Number((costUSD * (1 + marginClientPct/100)).toFixed(2)) : undefined;
      const priceAllyUSD = typeof costUSD === 'number' ? Number((costUSD * (1 + marginAllyPct/100)).toFixed(2)) : undefined;
      const priceWholesaleUSD = typeof costUSD === 'number' ? Number((costUSD * (1 + marginWholesalePct/100)).toFixed(2)) : undefined;

      const data: any = {
        name: it.name,
        brand: it.brand || 'Sin marca',
        description: it.description || null,
        images: it.images || [],
        sku: code || it.sku || null,
        code: code || null,
        barcode: barcode || null,
        stock: Number(it.stock || 0),
        supplierId: it.supplierId || null,
      };
      if (it.categorySlug) {
        try { const cat = await prisma.category.findFirst({ where: { slug: it.categorySlug } }); if (cat) data.categoryId = cat.id; } catch {}
      }
      if (typeof costUSD === 'number') {
        data.costUSD = costUSD as any; data.lastCost = costUSD as any; data.avgCost = costUSD as any;
        data.marginClientPct = marginClientPct as any; data.marginAllyPct = marginAllyPct as any; data.marginWholesalePct = marginWholesalePct as any;
      }
      if (typeof priceClientUSD === 'number') {
        data.priceUSD = priceClientUSD as any; data.priceClientUSD = priceClientUSD as any;
        if (typeof priceAllyUSD === 'number') data.priceAllyUSD = priceAllyUSD as any;
        if (typeof priceWholesaleUSD === 'number') data.priceWholesaleUSD = priceWholesaleUSD as any;
      }
      if (product) {
        await prisma.product.update({ where: { id: product.id }, data });
      } else {
        const slugBase = it.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
        const slug = `${slugBase}-${Math.random().toString(36).slice(2,7)}`;
        await prisma.product.create({ data: { ...data, slug } });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
