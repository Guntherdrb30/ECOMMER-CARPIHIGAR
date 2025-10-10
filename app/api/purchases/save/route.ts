import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type SaveItem = {
  productId?: string | null;
  code?: string | null;
  name: string;
  quantity: number;
  costUSD: number;
  marginClientPct: number;
  marginAllyPct: number;
  marginWholesalePct: number;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || ((session.user as any)?.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const schema = z.object({
      supplierId: z.string().optional().nullable(),
      currency: z.enum(['USD','VES']).default('USD'),
      tasaVES: z.coerce.number().default(0),
      notes: z.string().optional(),
      items: z.array(z.object({
        productId: z.string().optional().nullable(),
        code: z.string().optional().nullable(),
        name: z.string().min(1),
        quantity: z.coerce.number().min(0.0001),
        costUSD: z.coerce.number().min(0),
        marginClientPct: z.coerce.number().min(0),
        marginAllyPct: z.coerce.number().min(0),
        marginWholesalePct: z.coerce.number().min(0),
      })).min(1),
    });
    const body = schema.parse(await req.json());
    const supplierId: string | undefined = (body?.supplierId || undefined) as any;
    const currency: 'USD'|'VES' = body.currency;
    const tasaVES: number = Number(body?.tasaVES || 0) || 0;
    const notes: string | undefined = body?.notes || undefined;
    const items: SaveItem[] = body.items as any;

    let subtotalUSD = 0;
    for (const it of items) subtotalUSD += Number(it.quantity) * Number(it.costUSD);

    // Create purchase header
    const purchase = await prisma.purchase.create({
      data: {
        supplierId: supplierId || null,
        currency: currency as any,
        tasaVES: (tasaVES || 0) as any,
        subtotalUSD: subtotalUSD as any,
        totalUSD: subtotalUSD as any,
        notes: notes || null,
        createdById: (session.user as any)?.id,
      },
    });

    for (const it of items) {
      // compute prices
      const priceClientUSD = Number((it.costUSD * (1 + it.marginClientPct / 100)).toFixed(2));
      const priceAllyUSD = Number((it.costUSD * (1 + it.marginAllyPct / 100)).toFixed(2));
      const priceWholesaleUSD = Number((it.costUSD * (1 + it.marginWholesalePct / 100)).toFixed(2));

      if (it.productId) {
        // Update existing product
        const p = await prisma.product.findUnique({ where: { id: it.productId } });
        if (p) {
          const oldStock = Number(p.stock || 0);
          const oldAvg = Number(p.avgCost || p.costUSD || it.costUSD || 0);
          const newAvg = (oldStock * oldAvg + Number(it.quantity) * Number(it.costUSD)) / Math.max(1, oldStock + Number(it.quantity));
          await prisma.product.update({
            where: { id: p.id },
            data: {
              lastCost: it.costUSD as any,
              costUSD: it.costUSD as any,
              avgCost: newAvg as any,
              marginClientPct: it.marginClientPct as any,
              marginAllyPct: it.marginAllyPct as any,
              marginWholesalePct: it.marginWholesalePct as any,
              priceClientUSD: priceClientUSD as any,
              priceUSD: priceClientUSD as any, // mantener compatibilidad
              priceAllyUSD: priceAllyUSD as any,
              priceWholesaleUSD: priceWholesaleUSD as any,
              stock: { increment: Number(it.quantity) },
            },
          });
        }
      } else {
        // Create new product
        const created = await prisma.product.create({
          data: {
            name: it.name,
            slug: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            brand: 'Sin marca',
            images: [],
            sku: it.code || null,
            code: it.code || null,
            stock: Number(it.quantity),
            supplierId: supplierId || null,
            costUSD: it.costUSD as any,
            lastCost: it.costUSD as any,
            avgCost: it.costUSD as any,
            marginClientPct: it.marginClientPct as any,
            marginAllyPct: it.marginAllyPct as any,
            marginWholesalePct: it.marginWholesalePct as any,
            priceClientUSD: priceClientUSD as any,
            priceUSD: priceClientUSD as any,
            priceAllyUSD: priceAllyUSD as any,
            priceWholesaleUSD: priceWholesaleUSD as any,
          },
          select: { id: true },
        });
        it.productId = created.id;
      }

      const subtotal = Number(it.quantity) * Number(it.costUSD);
      await prisma.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: String(it.productId),
          name: it.name,
          quantity: Number(it.quantity),
          costUSD: Number(it.costUSD) as any,
          subtotalUSD: subtotal as any,
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: String(it.productId),
          type: 'ENTRADA' as any,
          quantity: Number(it.quantity),
          reason: `PURCHASE ${purchase.id}`,
          userId: (session.user as any)?.id,
        },
      });
    }

    try { await prisma.auditLog.create({ data: { userId: (session.user as any)?.id, action: 'PURCHASE_SAVE', details: purchase.id } }); } catch {}
    revalidatePath('/dashboard/admin/compras');
    return NextResponse.json({ ok: true, id: purchase.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo guardar la compra' }, { status: 500 });
  }
}
