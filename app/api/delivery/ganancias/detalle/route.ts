import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function toYmd(d: Date) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'DELIVERY') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const meId = (session.user as any).id as string;

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const now = new Date();
  const defFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defTo = now;
  const fromDate = from ? new Date(from) : defFrom;
  const toDate = to ? new Date(to) : defTo;

  const orders = await prisma.order.findMany({
    where: {
      shipping: { carrier: 'DELIVERY' as any, assignedToId: meId, status: 'ENTREGADO' as any },
      shippingAddress: { city: { equals: 'Barinas', mode: 'insensitive' } },
    },
    include: { user: { select: { name: true, email: true } }, shipping: true, shippingAddress: true },
    orderBy: { updatedAt: 'desc' },
  });

  const deliveredAt = (o: any) => new Date(o.shipping?.updatedAt || o.updatedAt);
  const inRange = orders.filter((o: any) => deliveredAt(o) >= startOfDay(fromDate) && deliveredAt(o) <= endOfDay(toDate));

  const rows: string[] = [];
  rows.push(['date','order_id','customer','address','city','delivery_fee_usd'].join(','));
  for (const o of inRange) {
    const date = toYmd(deliveredAt(o));
    const addr = (o.shippingAddress?.address1 || '').replaceAll(',', ' ');
    const city = (o.shippingAddress?.city || '').replaceAll(',', ' ');
    const fee = String(o.shipping?.deliveryFeeUSD || '');
    const customer = (o.user?.name || o.user?.email || '').replaceAll(',', ' ');
    rows.push([date, o.id, customer, addr, city, fee].join(','));
  }

  const csv = rows.join('\n');
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="delivery_ganancias_detalle_${toYmd(fromDate)}_${toYmd(toDate)}.csv"` } });
}
