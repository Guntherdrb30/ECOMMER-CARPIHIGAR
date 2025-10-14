import { getPOById, receivePO } from "@/server/actions/procurement";
import PoReceiveEditor from "@/components/admin/po-receive-editor";

export default async function VerOCPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  let po: any = null;
  let sp: any = {};
  try {
    const r = await Promise.all([getPOById(id), (async () => (await searchParams) || {})()]);
    po = r[0];
    sp = r[1] || {};
  } catch {
    po = null;
  }
  if (!po) return <div className="container mx-auto p-4">OC no encontrada</div> as any;
  const message = (sp as any).message;
  const error = (sp as any).error;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">OC {po.id.slice(-6)}</h1>
        <div className="flex items-center gap-2">
          <a href="/dashboard/admin/compras" className="border px-3 py-1 rounded">
            Volver
          </a>
          <a className="border px-3 py-1 rounded" target="_blank" href={`/dashboard/admin/compras/${po.id}/print`}>
            Imprimir
          </a>
          <a
            className="border px-3 py-1 rounded"
            target="_blank"
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `OC ${po.id}\nProveedor: ${po.supplier?.name}\nTotal: $${Number(po.totalUSD).toFixed(2)}\nItems:\n` +
                po.items
                  .map((it: any) => `- ${it.product?.name} · ${it.quantity} x $${Number(it.costUSD).toFixed(2)}`)
                  .join("\n"),
            )}`}
          >
            WhatsApp
          </a>
        </div>
      </div>
      {message && (
        <div className="border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">{message}</div>
      )}
      {error && <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">{error}</div>}

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-sm text-gray-600">Proveedor</div>
            <div>{po.supplier?.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Estado</div>
            <div className="font-semibold">{po.status}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total USD</div>
            <div>${Number(po.totalUSD).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Creada por</div>
            <div>{po.createdBy?.name || po.createdBy?.email || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Recibida por</div>
            <div>{po.receivedBy?.name || po.receivedBy?.email || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Recepción</div>
            <div>{po.receivedAt ? new Date(po.receivedAt as any).toLocaleString() : "—"}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2">Cant. Pedida</th>
                <th className="px-3 py-2">Recibida</th>
                <th className="px-3 py-2">Pendiente</th>
                <th className="px-3 py-2">Costo USD</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it: any) => {
                const pending = Number(it.quantity) - Number(it.received);
                return (
                  <tr key={it.id}>
                    <td className="border px-3 py-2">{it.product?.name}</td>
                    <td className="border px-3 py-2 text-center">{it.quantity}</td>
                    <td className="border px-3 py-2 text-center">{it.received}</td>
                    <td className="border px-3 py-2 text-center">{pending}</td>
                    <td className="border px-3 py-2 text-right">{Number(it.costUSD).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {po.status !== "RECEIVED" && (
        <div className="form-card">
          <h2 className="text-lg font-bold mb-2">Recepción</h2>
          <form action={receivePO} className="space-y-2">
            <input type="hidden" name="poId" value={po.id} />
            <div>
              <label className="form-label">Recibido por</label>
              <input className="form-input" defaultValue="Se registrará el usuario actual" readOnly />
            </div>
            <PoReceiveEditor items={po.items} />
            <div className="mt-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded">Registrar Recepción</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
