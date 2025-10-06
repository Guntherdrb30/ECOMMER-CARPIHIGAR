import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statusFilter = (searchParams.get('status') || 'TODOS').toUpperCase();
  const bucketFilter = (searchParams.get('bucket') || 'TODOS').toUpperCase();
  const invoiceQ = (searchParams.get('invoice') || '').trim();
  const clienteQ = (searchParams.get('cliente') || '').trim();
  const rifQ = (searchParams.get('rif') || '').trim();

  const where: any = { saleType: 'CREDITO' } as any;
  if (invoiceQ) (where as any).id = { contains: invoiceQ };
  if (rifQ) (where as any).customerTaxId = { contains: rifQ, mode: 'insensitive' };
  if (clienteQ) (where as any).user = { is: { OR: [ { name: { contains: clienteQ, mode: 'insensitive' } as any }, { email: { contains: clienteQ, mode: 'insensitive' } as any } ] } };

  const orders = await prisma.order.findMany({
    where: where as any,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      seller: { select: { name: true, email: true } },
      receivable: { include: { entries: true } },
    },
  });

  const computed = orders.map((o) => {
    const abonadoUSD = (o.receivable?.entries || []).reduce((acc, e) => acc + Number((e as any).amountUSD), 0);
    const totalUSD = Number(o.totalUSD);
    const saldoUSD = Math.max(0, totalUSD - abonadoUSD);
    const vence = (o.receivable?.dueDate || (o as any).creditDueDate || null) as Date | null;
    const estado = (o.receivable?.status || 'PENDIENTE') as string;
    const baseDate = vence ? new Date(vence) : new Date(o.createdAt as any);
    const today = new Date();
    const days = Math.floor((today.getTime() - baseDate.getTime()) / (1000*60*60*24));
    const bucket = days <= 10 ? '0-10' : days <= 20 ? '11-20' : days <= 30 ? '21-30' : 'VENCIDA';
    return { o, abonadoUSD, totalUSD, saldoUSD, vence, estado, days, bucket };
  });

  const filtered = computed.filter((r) => {
    if (statusFilter !== 'TODOS' && r.estado !== statusFilter) return false;
    if (bucketFilter !== 'TODOS' && r.bucket !== bucketFilter) return false;
    return true;
  });

  const csvRows = [
    ['orderId','cliente','email','telefono','vendedor','totalUSD','abonadoUSD','saldoUSD','fecha','vence','estado','bucket'],
    ...filtered.map(({ o, abonadoUSD, totalUSD, saldoUSD, vence, estado, bucket }) => {
      const cliente = o.user?.name || '';
      const email = o.user?.email || '';
      const telefono = (o.user as any)?.phone ? String((o.user as any).phone) : '';
      const vendedor = o.seller?.name || o.seller?.email || '';
      const fecha = new Date(o.createdAt as any).toISOString();
      const venceIso = vence ? new Date(vence as any).toISOString() : '';
      return [o.id, cliente, email, telefono, vendedor, totalUSD.toFixed(2), abonadoUSD.toFixed(2), saldoUSD.toFixed(2), fecha, venceIso, estado, bucket];
    })
  ];
  const csv = csvRows.map(r => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `cuentas_por_cobrar_${Date.now()}.csv`;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    }
  });
}
