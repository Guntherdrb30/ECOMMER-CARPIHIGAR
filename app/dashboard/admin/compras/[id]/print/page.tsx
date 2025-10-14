import { getPOById } from "@/server/actions/procurement";
import { getSettings } from "@/server/actions/settings";
import PrintButton from "@/components/print-button";

export default async function PrintPOPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let po: any = null;
  let settings: any = {};
  try {
    const r = await Promise.all([getPOById(id), getSettings()]);
    po = r[0];
    settings = r[1] || {};
  } catch {}
  if (!po) return <div className="p-4">OC no encontrada</div> as any;

  return (
    <div className="p-6 text-sm">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="space-x-2">
          <a className="px-3 py-1 border rounded" href={`/dashboard/admin/compras/${po.id}`}>Volver</a>
        </div>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto bg-white p-6 border rounded print:border-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xl font-bold">{(settings as any).brandName || 'Carpihogar.ai'}</div>
            <div className="text-gray-600">{(settings as any).contactEmail} · {String((settings as any).contactPhone)}</div>
          </div>
          {(settings as any).logoUrl && (
            <img src={(settings as any).logoUrl} alt="logo" className="h-10" />
          )}
        </div>

        <div className="flex justify-between mb-4">
          <div>
            <div className="font-semibold">Orden de Compra</div>
            <div className="text-gray-600">OC: {po.id}</div>
            <div className="text-gray-600">Fecha: {new Date(po.createdAt as any).toLocaleString()}</div>
            {po.expectedAt && (
              <div className="text-gray-600">Esperada: {new Date(po.expectedAt as any).toLocaleDateString()}</div>
            )}
            <div className="text-gray-600">Estado: {po.status}</div>
          </div>
          <div>
            <div className="font-semibold">Proveedor</div>
            <div>{po.supplier?.name}</div>
          </div>
        </div>

        <table className="w-full table-auto text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-2 py-1">Producto</th>
              <th className="text-right px-2 py-1">Cant.</th>
              <th className="text-right px-2 py-1">Costo USD</th>
              <th className="text-right px-2 py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((it: any) => {
              const cost = Number(it.costUSD);
              const sub = cost * Number(it.quantity);
              return (
                <tr key={it.id}>
                  <td className="border px-2 py-1">{it.product?.name}</td>
                  <td className="border px-2 py-1 text-right">{it.quantity}</td>
                  <td className="border px-2 py-1 text-right">{cost.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{sub.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between">
          <div>
            <div className="text-gray-600">Creada por: {po.createdBy?.name || po.createdBy?.email || '—'}</div>
            {po.receivedBy && (
              <div className="text-gray-600">Recibida por: {po.receivedBy?.name || po.receivedBy?.email} {po.receivedAt ? `(${new Date(po.receivedAt as any).toLocaleString()})` : ''}</div>
            )}
            {po.notes && <div className="text-gray-600">Notas: {po.notes}</div>}
          </div>
          <div className="w-56">
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total USD</span><span>${Number(po.totalUSD).toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
