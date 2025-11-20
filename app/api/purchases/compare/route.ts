import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || ((session.user as any)?.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const schema = z.object({
      currency: z.enum(['USD', 'VES']).default('USD'),
      tasaVES: z.coerce.number().default(0),
      lines: z.array(z.object({
        code: z.string().trim().min(1).nullable().optional().transform(v => v || null),
        name: z.string().trim().min(1),
        quantity: z.coerce.number().min(0.0001),
        unitCost: z.coerce.number().min(0),
      })).default([]),
    });
    const parsed = schema.parse(await req.json());
    const currency = parsed.currency;
    const tasaVES = Number(parsed.tasaVES || 0);
    const lines = parsed.lines;

    const results: any[] = [];

    for (const l of lines) {
      const code = (l.code || '').trim();
      const digits = code.replace(/\D/g, '');
      const name = String(l.name).trim();
      // Convert cost to USD if needed
      const costUSD = currency === 'VES' && tasaVES > 0 ? Number(l.unitCost) / tasaVES : Number(l.unitCost);

      let product: any | null = null;
      // Try find by code/sku/barcode, then by name
      if (code) {
        product = await prisma.product.findFirst({
          where: {
            OR: [
              { code: code },
              { sku: code },
              ...(digits.length >= 6 ? [{ barcode: digits }] : []),
            ],
          },
          select: {
            id: true,
            name: true,
            sku: true,
            code: true,
            barcode: true,
            priceUSD: true,
            priceAllyUSD: true,
            priceWholesaleUSD: true,
            costUSD: true,
            avgCost: true,
            lastCost: true,
            marginClientPct: true,
            marginAllyPct: true,
            marginWholesalePct: true,
            supplierCode: true,
            description: true,
            weightKg: true,
            soldBy: true,
            unitsPerPackage: true,
          },
        });
      }
      if (!product) {
        product = await prisma.product.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } },
          select: {
            id: true,
            name: true,
            sku: true,
            code: true,
            barcode: true,
            priceUSD: true,
            priceAllyUSD: true,
            priceWholesaleUSD: true,
            costUSD: true,
            avgCost: true,
            lastCost: true,
            marginClientPct: true,
            marginAllyPct: true,
            marginWholesalePct: true,
            supplierCode: true,
            description: true,
            weightKg: true,
            soldBy: true,
            unitsPerPackage: true,
          },
        });
      }

      const marginClient = product?.marginClientPct ? Number(product.marginClientPct) : 40;
      const marginAlly = product?.marginAllyPct ? Number(product.marginAllyPct) : 30;
      const marginWholesale = product?.marginWholesalePct ? Number(product.marginWholesalePct) : 20;

      const priceClient = costUSD * (1 + marginClient / 100);
      const priceAlly = costUSD * (1 + marginAlly / 100);
      const priceWholesale = costUSD * (1 + marginWholesale / 100);

      const status = product ? 'EXISTENTE' : 'NUEVO';
      const action = product ? 'ACTUALIZAR' : 'CREAR';

      results.push({
        input: l,
        code: code || null,
        name,
        quantity: Number(l.quantity),
        costUSD: Number(costUSD.toFixed(4)),
        marginClientPct: marginClient,
        marginAllyPct: marginAlly,
        marginWholesalePct: marginWholesale,
        priceClientUSD: Number(priceClient.toFixed(2)),
        priceAllyUSD: Number(priceAlly.toFixed(2)),
        priceWholesaleUSD: Number(priceWholesale.toFixed(2)),
        product,
        supplierCode: product?.supplierCode || null,
        description: product?.description || null,
        weightKg: product?.weightKg != null ? Number(product.weightKg) : null,
        soldBy: product?.soldBy || null,
        unitsPerPackage:
          (product as any)?.unitsPerPackage != null
            ? Number((product as any).unitsPerPackage)
            : null,
        estadoIA: status,
        accion: action,
      });
    }

    return NextResponse.json({ items: results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error en comparación' }, { status: 500 });
  }
}
