import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { markPaidRange } from '@/server/actions/shipping';

function startOfDay(d: Date) { const x=new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x=new Date(d); x.setHours(23,59,59,999); return x; }
function toYmd(d: Date) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }

export default async function DeliveryLiquidacionesPage({ searchParams }: { searchParams?: { user?: string; from?: string; to?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') redirect('/auth/login');

  const deliveries = await prisma.user.findMany({ where: { role: 'DELIVERY' as any }, select: { id:true, name:true, email:true } });
  const defaultUser = deliveries[0]?.id || '';

  const selectedUser = (searchParams as any)?.user || defaultUser;
  const now = new Date();
  const isFirstHalf = now.getDate() <= 15;
  const defFrom = isFirstHalf ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), 16);
  const defTo = isFirstHalf ? new Date(now.getFullYear(), now.getMonth(), 15) : new Date(now.getFullYear(), now.getMonth()+1, 0);
  const defFromStr = toYmd(defFrom);
  const defToStr = toYmd(defTo);
  const from = (searchParams as any)?.from ? new Date((searchParams as any).from) : defFrom;
  const to = (searchParams as any)?.to ? new Date((searchParams as any).to) : defTo;

  const orders = selectedUser ? await prisma.order.findMany({
    where: {
      shipping: { carrier: 'DELIVERY' as any, assignedToId: selectedUser, status: 'ENTREGADO' as any },
      shippingAddress: { city: { equals: 'Barinas', mode: 'insensitive' } },
      updatedAt: { gte: startOfDay(from), lte: endOfDay(to) },
    },
    include: { shipping: true },
    orderBy: { updatedAt: 'desc' },
  }) : [];

  const sum = (arr: typeof orders) => arr.reduce((acc, o) => acc + parseFloat(String(o.shipping?.deliveryFeeUSD || 0)), 0);
  const pending = orders.filter(o => !o.shipping?.deliveryPaidAt);
  const paid = orders.filter(o => !!o.shipping?.deliveryPaidAt);

  const fromStr = toYmd(from); const toStr = toYmd(to);

  const qs = (p: Record<string,string>) => new URLSearchParams(p).toString();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Liquidaciones Delivery</h1>

      <form method="get" className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Delivery</label>
          <select name="user" defaultValue={selectedUser} className="border rounded px-2 py-1 w-full">
            {deliveries.map(d => (<option key={d.id} value={d.id}>{d.name || d.email}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Desde</label>
          <input type="date" name="from" defaultValue={fromStr} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Hasta</label>
          <input type="date" name="to" defaultValue={toStr} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <button className="px-3 py-2 rounded bg-blue-600 text-white w-full">Filtrar</button>
        </div>
        <div>
          <a className="px-3 py-2 rounded border w-full inline-block text-center" href={`/dashboard/admin/delivery/liquidaciones?${new URLSearchParams({ user: String(selectedUser), from: defFromStr, to: defToStr }).toString()}`}>Periodo actual</a>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-gray-500">En rango</div>
          <div className="text-2xl font-bold">{orders.length}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-gray-500">Pendientes</div>
          <div className="text-2xl font-bold">{pending.length}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-gray-500">Pagadas</div>
          <div className="text-2xl font-bold">{paid.length}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-gray-500">Total a pagar</div>
          <div className="text-2xl font-bold">${sum(pending).toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a className="px-3 py-2 rounded border" href={`/api/admin/delivery/ganancias/detalle?${qs({ deliveryUserId: selectedUser, from: fromStr, to: toStr })}`}>CSV Detalle</a>
        <a className="px-3 py-2 rounded border" href={`/api/admin/delivery/ganancias/resumen?${qs({ deliveryUserId: selectedUser, from: fromStr, to: toStr })}`}>CSV Resumen</a>
        <form action={async (formData) => { 'use server'; formData.set('deliveryUserId', String(selectedUser)); formData.set('from', fromStr); formData.set('to', toStr); try { await markPaidRange(String(selectedUser), fromStr, toStr); } catch {}; }}>
          <button className="px-3 py-2 rounded bg-green-600 text-white">Marcar pagado</button>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Orden</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Pago</th>
              <th className="px-3 py-2">Fee</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b">
                <td className="px-3 py-2">{new Date((o as any).updatedAt).toLocaleString('es-VE')}</td>
                <td className="px-3 py-2">{o.id.slice(0,8)}</td>
                <td className="px-3 py-2">{o.shipping?.status}</td>
                <td className="px-3 py-2">{o.shipping?.deliveryPaidAt ? new Date(o.shipping.deliveryPaidAt as any).toLocaleDateString('es-VE') : 'Pendiente'}</td>
                <td className="px-3 py-2">${String(o.shipping?.deliveryFeeUSD || '')}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-gray-600">Sin entregas ENTREGADO en el rango.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
