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
      currency: z.enum(['USD', 'VES', 'USDT']).default('USD'),
      tasaVES: z.coerce.number().default(0),
      notes: z.string().optional(),
      invoiceNumber: z.string().optional().nullable(),
      baseAmountUSD: z.coerce.number().optional(),
      discountPercent: z.coerce.number().optional(),
      discountAmountUSD: z.coerce.number().optional(),
      ivaPercent: z.coerce.number().optional(),
      ivaAmountUSD: z.coerce.number().optional(),
      totalInvoiceUSD: z.coerce.number().optional(),
      itemsCount: z.coerce.number().optional(),
      paymentCurrency: z.enum(['USD', 'VES', 'USDT']).optional(),
      bankAccountId: z.string().optional().nullable(),
      paymentReference: z.string().optional().nullable(),
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
    const currency: 'USD' | 'VES' | 'USDT' = body.currency;
    const tasaVES: number = Number(body?.tasaVES || 0) || 0;
    const notes: string | undefined = body?.notes || undefined;
    const invoiceNumber: string | undefined = body?.invoiceNumber || undefined;
    const itemsCount: number | undefined = body?.itemsCount || undefined;
    const paymentCurrency: 'USD' | 'VES' | 'USDT' | undefined = body?.paymentCurrency || undefined;
    const bankAccountId: string | undefined = (body?.bankAccountId || undefined) as any;
    const paymentReference: string | undefined = body?.paymentReference || undefined;

    const items: SaveItem[] = body.items as any;

    let subtotalUSD = 0;
    for (const it of items) subtotalUSD += Number(it.quantity) * Number(it.costUSD);

    const baseAmountUSD =
      typeof body.baseAmountUSD === 'number' && !isNaN(body.baseAmountUSD)
        ? body.baseAmountUSD
        : subtotalUSD;
    const discountPercent =
      typeof body.discountPercent === 'number' && !isNaN(body.discountPercent)
        ? body.discountPercent
        : 0;
    const discountAmountUSD =
      typeof body.discountAmountUSD === 'number' && !isNaN(body.discountAmountUSD)
        ? body.discountAmountUSD
        : Number((baseAmountUSD * (discountPercent / 100)).toFixed(2));
    const ivaPercent =
      typeof body.ivaPercent === 'number' && !isNaN(body.ivaPercent)
        ? body.ivaPercent
        : 0;
    const ivaBase = baseAmountUSD - discountAmountUSD;
    const ivaAmountUSD =
      typeof body.ivaAmountUSD === 'number' && !isNaN(body.ivaAmountUSD)
        ? body.ivaAmountUSD
        : Number((ivaBase * (ivaPercent / 100)).toFixed(2));
    const totalInvoiceUSD =
      typeof body.totalInvoiceUSD === 'number' && !isNaN(body.totalInvoiceUSD)
        ? body.totalInvoiceUSD
        : Number((ivaBase + ivaAmountUSD).toFixed(2));

    // Crear cabecera de compra
    const purchase = await prisma.purchase.create({
      data: {
        supplierId: supplierId || null,
        currency: currency as any,
        tasaVES: (tasaVES || 0) as any,
        subtotalUSD: subtotalUSD as any,
        totalUSD: totalInvoiceUSD as any,
        invoiceNumber: invoiceNumber || null,
        baseAmountUSD: baseAmountUSD as any,
        discountPercent: discountPercent as any,
        discountAmountUSD: discountAmountUSD as any,
        ivaPercent: ivaPercent as any,
        ivaAmountUSD: ivaAmountUSD as any,
        itemsCount: itemsCount ?? items.length,
        notes: notes || null,
        createdById: (session.user as any)?.id,
      },
    });

    for (const it of items) {
      const priceClientUSD = Number((it.costUSD * (1 + it.marginClientPct / 100)).toFixed(2));
      const priceAllyUSD = Number((it.costUSD * (1 + it.marginAllyPct / 100)).toFixed(2));
      const priceWholesaleUSD = Number((it.costUSD * (1 + it.marginWholesalePct / 100)).toFixed(2));

      if (it.productId) {
        const p = await prisma.product.findUnique({ where: { id: it.productId } });
        if (p) {
          const oldStock = Number(p.stock || 0);
          const oldAvg = Number(p.avgCost || p.costUSD || it.costUSD || 0);
          const newAvg =
            (oldStock * oldAvg + Number(it.quantity) * Number(it.costUSD)) /
            Math.max(1, oldStock + Number(it.quantity));
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
              priceUSD: priceClientUSD as any,
              priceAllyUSD: priceAllyUSD as any,
              priceWholesaleUSD: priceWholesaleUSD as any,
              stock: { increment: Number(it.quantity) },
            },
          });
        }
      } else {
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

    // Registrar movimiento bancario si se indicó cuenta y moneda de pago
    if (bankAccountId && paymentCurrency && totalInvoiceUSD > 0) {
      try {
        await prisma.bankTransaction.create({
          data: {
            bankAccountId,
            type: 'DEBITO' as any,
            amount: totalInvoiceUSD as any,
            currency: paymentCurrency as any,
            description: `Compra a proveedor ${supplierId || ''}`.trim(),
            reference: paymentReference || null,
            purchaseId: purchase.id,
          },
        });
      } catch (e) {
        console.error('[purchases/save] bankTransaction error', e);
      }
    }

    // Crear cuenta por pagar asociada
    try {
      let dueDate: Date | null = null;
      if (supplierId) {
        const sup = await prisma.supplier.findUnique({
          where: { id: supplierId },
          select: { givesCredit: true, creditDays: true },
        });
        if (sup?.givesCredit && sup.creditDays && Number(sup.creditDays) > 0) {
          const base = new Date(purchase.createdAt as any);
          base.setDate(base.getDate() + Number(sup.creditDays));
          dueDate = base;
        }
      }
      const initialStatus: 'PENDIENTE' | 'PAGADO' =
        bankAccountId && paymentCurrency && totalInvoiceUSD > 0 ? 'PAGADO' : 'PENDIENTE';
      const initialBalance = initialStatus === 'PAGADO' ? 0 : totalInvoiceUSD;

      const payable = await prisma.payable.create({
        data: {
          purchaseId: purchase.id,
          supplierId: supplierId || null,
          totalUSD: totalInvoiceUSD as any,
          balanceUSD: initialBalance as any,
          status: initialStatus as any,
          dueDate,
        },
      });

      if (initialStatus === 'PAGADO' && totalInvoiceUSD > 0) {
        await prisma.payableEntry.create({
          data: {
            payableId: payable.id,
            amountUSD: totalInvoiceUSD as any,
            currency: (paymentCurrency || currency) as any,
            method: null,
            bankAccountId: bankAccountId || null,
            reference: paymentReference || null,
            notes: 'Pago registrado al crear la compra',
          },
        });
      }
    } catch (e) {
      console.error('[purchases/save] payable create error', e);
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: (session.user as any)?.id,
          action: 'PURCHASE_SAVE',
          details: purchase.id,
        },
      });
    } catch {}
    revalidatePath('/dashboard/admin/compras');
    return NextResponse.json({ ok: true, id: purchase.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'No se pudo guardar la compra' },
      { status: 500 },
    );
  }
}

