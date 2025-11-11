import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function LogisticaPage({ searchParams }: { searchParams?: Promise<{ status?: string; provider?: string }> }){
  const sp = (await searchParams) || {} as any;
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return (<div className="p-6">No autorizado</div>);
  const where: any = {};
  if (sp.status) where.status = String(sp.status).toUpperCase();
  if (sp.provider) where.carrier = String(sp.provider).toUpperCase();
  const shipments = await prisma.shipping.findMany({ where, include: { order: { include: { user: true, shippingAddress: true } } }, orderBy: { updatedAt: 'desc' }, take: 50 });
  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Logística - Últimos envíos</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-700">
              <th className="p-2 border">Shipment</th>
              <th className="p-2 border">Orden</th>
              <th className="p-2 border">Cliente</th>
              <th className="p-2 border">Ciudad</th>
              <th className="p-2 border">Proveedor</th>
              <th className="p-2 border">Estado</th>
              <th className="p-2 border">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="text-sm">
                <td className="p-2 border">{s.id.slice(-6)}</td>
                <td className="p-2 border">{s.orderId.slice(-6)}</td>
                <td className="p-2 border">{s.order.user?.name || s.order.user?.email}</td>
                <td className="p-2 border">{s.order.shippingAddress?.city}</td>
                <td className="p-2 border">{String(s.carrier)}</td>
                <td className="p-2 border">{String(s.status)}</td>
                <td className="p-2 border">{new Date(s.updatedAt as any).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
