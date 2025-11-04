import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type Search = { q?: string };

export default async function ShippingLogsPage({ searchParams }: { searchParams?: Search }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white p-6 rounded shadow">No autorizado</div>
      </div>
    );
  }

  const q = String(searchParams?.q || '').trim();
  const where: any = {
    OR: [
      { action: { startsWith: 'SHIPPING_' } as any },
      { action: { in: ['DELIVERY_ASSIGNED','DELIVERY_COMPLETED','CUSTOMER_CONFIRMED_DELIVERY'] } as any },
    ],
  };
  if (q) {
    where.details = { contains: q, mode: 'insensitive' } as any;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 300,
  });

  function parseDetails(row: any) {
    try {
      const d = JSON.parse(String(row.details || '{}'));
      const orderId = d.orderId || d.order || row.details;
      const before = d.before || {};
      const after = d.after || {};
      return { orderId, before, after };
    } catch {
      return { orderId: row.details, before: {}, after: {} };
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Logs de Envíos</h1>
      <form method="get" className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Filtrar por orderId, tracking, detalles" className="border rounded px-2 py-1 flex-1" />
        <button className="px-3 py-1 rounded border">Buscar</button>
        {q && (<a className="px-3 py-1 rounded border" href="/dashboard/admin/envios/logs">Limpiar</a>)}
      </form>
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Usuario</th>
              <th className="px-3 py-2 text-left">Acción</th>
              <th className="px-3 py-2 text-left">Orden</th>
              <th className="px-3 py-2 text-left">De → A</th>
              <th className="px-3 py-2 text-left">Carrier</th>
              <th className="px-3 py-2 text-left">Tracking</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row: any) => {
              const d = parseDetails(row);
              const fromTo = (d.before?.status || '-') + ' → ' + (d.after?.status || '-');
              const carrier = (d.after?.carrier || d.before?.carrier || '-') as string;
              const tracking = (d.after?.tracking || d.before?.tracking || '-') as string;
              return (
                <tr key={row.id} className="border-b">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.userId || '-'}</td>
                  <td className="px-3 py-2">{row.action}</td>
                  <td className="px-3 py-2">{String(d.orderId || '-').slice(0, 12)}</td>
                  <td className="px-3 py-2">{fromTo}</td>
                  <td className="px-3 py-2">{carrier}</td>
                  <td className="px-3 py-2 font-mono">{tracking}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

