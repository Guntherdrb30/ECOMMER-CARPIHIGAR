import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DriverShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '');
  const meId = String((session?.user as any)?.id || '');
  if (!meId || (role !== 'DELIVERY' && role !== 'ADMIN')) return (<div className="p-6">No autorizado</div>);
  const s = await prisma.shipping.findUnique({ where: { id: p.id }, include: { order: { include: { user: true, shippingAddress: true } }, shipmentPhoto: true } as any });
  if (!s) return (<div className="p-6">No encontrado</div>);
  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Envío {s.id.slice(-6)}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div><span className="font-semibold">Cliente:</span> {s.order?.user?.name || s.order?.user?.email}</div>
          <div><span className="font-semibold">Dirección:</span> {s.order?.shippingAddress?.address1}, {s.order?.shippingAddress?.city}</div>
          <div><span className="font-semibold">Estado:</span> {String(s.status)}</div>
          <div className="flex gap-2 mt-2">
            <form action="/api/drivers/update-status" method="post"><input type="hidden" name="shipmentId" value={s.id} /><input type="hidden" name="newStatus" value="in_route" /><button className="px-2 py-1 rounded bg-blue-600 text-white">Marcar En Ruta</button></form>
            <form action="/api/drivers/update-status" method="post"><input type="hidden" name="shipmentId" value={s.id} /><input type="hidden" name="newStatus" value="delivered" /><button className="px-2 py-1 rounded bg-green-600 text-white">Marcar Entregado</button></form>
            <form action="/api/drivers/update-status" method="post"><input type="hidden" name="shipmentId" value={s.id} /><input type="hidden" name="newStatus" value="incident" /><button className="px-2 py-1 rounded bg-red-600 text-white">Incidencia</button></form>
          </div>
        </div>
        <div className="space-y-2">
          <div className="font-semibold">Evidencias</div>
          <form className="flex gap-2" action="/api/drivers/upload-evidence" method="post">
            <input type="hidden" name="shipmentId" value={s.id} />
            <input type="text" name="url" placeholder="URL de foto" className="border rounded px-2 py-1 flex-1" />
            <select name="type" className="border rounded px-2 py-1"><option value="package">Paquete</option><option value="delivered">Entregado</option></select>
            <button className="px-2 py-1 rounded border">Subir</button>
          </form>
          <form className="flex gap-2" action="/api/drivers/signature" method="post">
            <input type="hidden" name="shipmentId" value={s.id} />
            <input type="text" name="dataUrl" placeholder="DataURL de firma" className="border rounded px-2 py-1 flex-1" />
            <button className="px-2 py-1 rounded border">Guardar firma</button>
          </form>
          <div className="grid grid-cols-3 gap-2">
            {(s as any).shipmentPhoto?.map((ph: any) => (
              <div key={ph.id} className="border rounded p-1"><img src={ph.url} alt={ph.type} className="w-full h-24 object-cover" /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

