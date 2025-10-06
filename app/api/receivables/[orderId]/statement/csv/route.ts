import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import prisma from '@/lib/prisma';

export async function GET(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      seller: { select: { name: true, email: true } },
      receivable: { include: { entries: { orderBy: { createdAt: 'asc' } } } },
    },
  });
  if (!order) return new NextResponse('Not found', { status: 404 });

  const totalUSD = Number(order.totalUSD || 0);
  const entries = order.receivable?.entries || [];
  const abonadoUSD = entries.reduce((a: number, e: any) => a + Number(e.amountUSD || 0), 0);
  const saldoUSD = Math.max(0, totalUSD - abonadoUSD);
  const vence = (order.receivable?.dueDate || (order as any).creditDueDate || null) as Date | null;

  const rows: string[][] = [];
  rows.push(['Orden', order.id]);
  rows.push(['Cliente', order.user?.name || order.user?.email || '']);
  rows.push(['Email', order.user?.email || '']);
  rows.push(['Teléfono', String((order.user as any)?.phone || '')]);
  rows.push(['Vendedor', order.seller?.name || order.seller?.email || '']);
  rows.push(['Fecha', new Date(order.createdAt as any).toISOString()]);
  rows.push(['Vence', vence ? new Date(vence as any).toISOString() : '']);
  rows.push(['TotalUSD', totalUSD.toFixed(2)]);
  rows.push(['AbonadoUSD', abonadoUSD.toFixed(2)]);
  rows.push(['SaldoUSD', saldoUSD.toFixed(2)]);
  rows.push([]);
  rows.push(['Fecha','MontoUSD','Moneda','Método','Referencia','Notas']);
  for (const e of entries) {
    rows.push([
      new Date((e as any).createdAt as any).toISOString(),
      Number((e as any).amountUSD).toFixed(2),
      String((e as any).currency || ''),
      String((e as any).method || ''),
      String((e as any).reference || ''),
      String((e as any).notes || ''),
    ]);
  }

  const csv = rows.map(r => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `cxc_${order.id}.csv`;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    }
  });
}
