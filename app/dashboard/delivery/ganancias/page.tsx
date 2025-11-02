import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); const day = x.getDay(); const diff = (day === 0 ? 6 : day - 1); x.setDate(x.getDate() - diff); return x; }
function startOfMonth(d: Date) { const x = startOfDay(d); x.setDate(1); return x; }
function toYmd(d: Date) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }

export default async function DeliveryEarningsPage({ searchParams }: { searchParams?: { from?: string; to?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'DELIVERY') redirect('/auth/login?callbackUrl=/dashboard/delivery/ganancias');
  const meId = (session.user as any).id as string;

  const now = new Date();
  const defFrom = startOfMonth(now);
  const defTo = now;

  const fromParam = (searchParams as any)?.from as string | undefined;
  const toParam = (searchParams as any)?.to as string | undefined;
  const fromDate = fromParam ? new Date(fromParam) : defFrom;
  const toDate = toParam ? new Date(toParam) : defTo;

  const orders = await prisma.order.findMany({
    where: {
      shipping: { carrier: 'DELIVERY' as any, assignedToId: meId, status: 'ENTREGADO' as any },
      shippingAddress: { city: { equals: 'Barinas', mode: 'insensitive' } },
    },
    include: { shipping: true, shippingAddress: true },
    orderBy: { updatedAt: 'desc' },
  });

  const deliveredAt = (o: typeof orders[number]) => new Date((o.shipping as any)?.updatedAt || (o as any).updatedAt);
  const inRange = orders.filter(o => deliveredAt(o) >= startOfDay(fromDate) && deliveredAt(o) <= endOfDay(toDate));

  const sum = (arr: typeof orders) => arr.reduce((acc, o) => acc + parseFloat(String((o.shipping as any)?.deliveryFeeUSD || 0)), 0);

  const d0 = startOfDay(now); const w0 = startOfWeek(now); const m0 = startOfMonth(now);
  const today = orders.filter(o => deliveredAt(o) >= d0);
  const week = orders.filter(o => deliveredAt(o) >= w0);
  const month = orders.filter(o => deliveredAt(o) >= m0);

  // Group by day for selected range
  const groups = new Map<string, typeof orders>();
  for (const o of inRange) { const k = toYmd(deliveredAt(o)); const a = groups.get(k) || ([] as typeof orders); a.push(o); groups.set(k, a); }
  const grouped = Array.from(groups.entries()).sort((a,b) => a[0] < b[0] ? 1 : -1);

  const qs = (p: Record<string,string>) => new URLSearchParams(p).toString();
  const fromStr = toYmd(fromDate); const toStr = toYmd(toDate);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Ganancias</h1>

      <form method="get" className="bg-white rounded shadow p-4 flex flex-col md:flex-row gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Desde</label>
          <input type="date" name="from" defaultValue={fromStr} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Hasta</label>
          <input type="date" name="to" defaultValue={toStr} className="border rounded px-2 py-1" />
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white">Filtrar</button>
        <a className="px-3 py-2 rounded border" href={`/api/delivery/ganancias/detalle?${qs({ from: fromStr, to: toStr })}`}>CSV Detalle</a>
        <a className="px-3 py-2 rounded border" href={`/api/delivery/ganancias/resumen?${qs({ from: fromStr, to: toStr })}`}>CSV Resumen</a>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <div className="bg-white rounded shadow p-4 md:col-span-2">
          <div className="text-xs text-gray-500">Total a pagar (rango)</div>
          <div className="text-2xl font-bold">${sum(inRange).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{fromStr} → {toStr}</div>
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
            <div className="p-4 text-gray-600">Sin entregas completadas en Barinas en el rango seleccionado.</div>
          )}
        </div>
      </div>
    </div>
  );
}
