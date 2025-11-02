import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); const day = x.getDay(); const diff = (day === 0 ? 6 : day - 1); x.setDate(x.getDate() - diff); return x; }
function startOfMonth(d: Date) { const x = startOfDay(d); x.setDate(1); return x; }
function toYmd(d: Date) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }

export default async function DeliveryEarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'DELIVERY') redirect('/auth/login?callbackUrl=/dashboard/delivery/ganancias');
  const meId = (session.user as any).id as string;

  const orders = await prisma.order.findMany({
    where: {
      shipping: { carrier: 'DELIVERY' as any, assignedToId: meId, status: 'ENTREGADO' as any },
      shippingAddress: { city: { equals: 'Barinas', mode: 'insensitive' } },
    },
    include: { shipping: true, shippingAddress: true },
    orderBy: { updatedAt: 'desc' },
  });

  const sum = (arr: typeof orders) => arr.reduce((acc, o) => acc + parseFloat(String(o.shipping?.deliveryFeeUSD || 0)), 0);
  const now = new Date();
  const d0 = startOfDay(now); const w0 = startOfWeek(now); const m0 = startOfMonth(now);

  const deliveredAt = (o: typeof orders[number]) => new Date(o.shipping?.updatedAt || o.updatedAt);

  const today = orders.filter(o => deliveredAt(o) >= d0);
  const week = orders.filter(o => deliveredAt(o) >= w0);
  const month = orders.filter(o => deliveredAt(o) >= m0);

  // Group by day for table
  const groups = new Map<string, typeof orders>();
  for (const o of orders) { const k = toYmd(deliveredAt(o)); const a = groups.get(k) || ([] as typeof orders); a.push(o); groups.set(k, a); }
  const grouped = Array.from(groups.entries()).sort((a,b) => a[0] < b[0] ? 1 : -1);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Ganancias</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-gray-500">Hoy</div>
          <div className="text-2xl font-bold">${sum(today).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{today.length} entregas</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-gray-500">Esta semana</div>
          <div className="text-2xl font-bold">${sum(week).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{week.length} entregas</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-gray-500">Este mes</div>
          <div className="text-2xl font-bold">${sum(month).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{month.length} entregas</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-2xl font-bold">${sum(orders).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{orders.length} entregas</div>
        </div>
      </div>

      <div className="bg-white rounded shadow">
        <div className="px-4 py-2 border-b font-semibold">Por día</div>
        <div className="divide-y">
          {grouped.map(([date, items]) => (
            <div key={date} className="p-4 flex items-center justify-between">
              <div className="text-sm">{date}</div>
              <div className="text-sm text-gray-600">{items.length} entregas</div>
              <div className="text-sm font-semibold">${sum(items).toFixed(2)}</div>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="p-4 text-gray-600">Sin entregas completadas en Barinas.</div>
          )}
        </div>
      </div>
    </div>
  );
}
