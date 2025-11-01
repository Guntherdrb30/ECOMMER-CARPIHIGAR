import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { claimDelivery, completeDelivery } from '@/server/actions/shipping';

export default async function DeliveryDashboard() {
  const session = await getServerSession(authOptions);
  const meId = (session?.user as any)?.id as string;

  const available = await prisma.order.findMany({
    where: { shipping: { carrier: 'DELIVERY', assignedToId: null, status: { in: ['PENDIENTE','PREPARANDO','DESPACHADO'] } } },
    include: { user: { select: { name: true, email: true, phone: true } }, shipping: true, shippingAddress: true },
    orderBy: { createdAt: 'asc' },
  });

  const mine = await prisma.order.findMany({
    where: { shipping: { carrier: 'DELIVERY', assignedToId: meId, status: { in: ['PENDIENTE','DESPACHADO','EN_TRANSITO'] } } },
    include: { user: { select: { name: true, email: true, phone: true } }, shipping: true, shippingAddress: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Panel de Delivery</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Entregas disponibles</h2>
        <div className="bg-white rounded shadow divide-y">
          {available.length === 0 && <div className="p-4 text-gray-600">No hay entregas disponibles.</div>}
          {available.map((o) => (
            <div key={o.id} className="p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">Pedido #{o.id.slice(0,8)}</div>
                <div className="text-gray-700">Cliente: {o.user?.name || o.user?.email}</div>
                <div className="text-gray-700">Dirección: {o.shippingAddress?.address1}, {o.shippingAddress?.city}</div>
              </div>
              <form action={async () => { 'use server'; await claimDelivery(o.id); }}>
                <button className="px-3 py-2 rounded bg-blue-600 text-white">Tomar entrega</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Mis entregas</h2>
        <div className="bg-white rounded shadow divide-y">
          {mine.length === 0 && <div className="p-4 text-gray-600">No tienes entregas asignadas.</div>}
          {mine.map((o) => (
            <div key={o.id} className="p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">Pedido #{o.id.slice(0,8)}</div>
                <div className="text-gray-700">Cliente: {o.user?.name || o.user?.email} · Tel: {(o.user as any)?.phone || '-'}</div>
                <div className="text-gray-700">Dirección: {o.shippingAddress?.address1}, {o.shippingAddress?.city}</div>
              </div>
              <div className="flex items-center gap-2">
                <a className="px-3 py-2 rounded border" href={`/api/shipments/${o.id}/pdf`} target="_blank">PDF</a>
                <form action={async () => { 'use server'; await completeDelivery(o.id); }}>
                  <button className="px-3 py-2 rounded bg-green-600 text-white">Marcar entregado</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
