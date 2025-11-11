import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DriversPage({ searchParams }: { searchParams?: Promise<{ status?: string; q?: string }> }) {
  const sp = (await searchParams) || {} as any;
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '');
  const meId = String((session?.user as any)?.id || '');
  if (!meId || (role !== 'DELIVERY' && role !== 'ADMIN')) return (<div className="p-6">No autorizado</div>);
  const where: any = { assignedToId: role === 'DELIVERY' ? meId : undefined };
  if (sp.status) where.status = String(sp.status).toUpperCase();
  const list = await prisma.shipping.findMany({ where, include: { order: { include: { user: true, shippingAddress: true } } }, orderBy: { updatedAt: 'desc' }, take: 50 });
  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Envíos asignados</h1>
        <form action="/api/drivers/optimize-route" method="post">
          <button className="px-3 py-2 rounded bg-[#E62C1A] text-white">Optimizar Ruta del Día</button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((s) => (
          <div key={s.id} className="border rounded-lg p-3 bg-white">
            <div className="text-sm text-gray-600">Orden {s.orderId.slice(-6)}</div>
            <div className="font-semibold">{s.order?.user?.name || s.order?.user?.email}</div>
            <div className="text-sm text-gray-700">{s.order?.shippingAddress?.address1} – {s.order?.shippingAddress?.city}</div>
            <div className="text-xs text-gray-500">Estado: {String(s.status)}</div>
            <div className="flex gap-2 mt-2">
              <a href={`/dashboard/drivers/${s.id}`} className="px-2 py-1 rounded border">Ver detalles</a>
              <form action="/api/drivers/update-status" method="post">
                <input type="hidden" name="shipmentId" value={s.id} />
                <input type="hidden" name="newStatus" value="in_route" />
                <button className="px-2 py-1 rounded bg-green-600 text-white">Iniciar entrega</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

