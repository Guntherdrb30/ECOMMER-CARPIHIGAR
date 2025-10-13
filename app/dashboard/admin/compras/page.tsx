import { getPOs, getSuppliers, getPurchases } from "@/server/actions/procurement";
import ShowToastFromSearch from '@/components/show-toast-from-search';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type SearchParamsLike = { message?: string; q?: string; proveedor?: string; desde?: string; hasta?: string; estado?: string };

export const dynamic = 'force-dynamic';

export default async function PurchasesPage({ searchParams }: { searchParams?: SearchParamsLike | Promise<SearchParamsLike> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || role !== 'ADMIN') {
    return <div className="p-4">No autorizado</div> as any;
  }

  const sp: any = typeof (searchParams as any)?.then === 'function' ? await (searchParams as any) : (searchParams || {});
  const q = String((sp as any).q || '');
  const proveedor = String((sp as any).proveedor || '');
  const desde = String((sp as any).desde || '');
  const hasta = String((sp as any).hasta || '');
  const estado = String((sp as any).estado || '');
  const [pos, suppliers, purchases] = await Promise.all([
    getPOs({ q: q || undefined, supplierId: proveedor || undefined, from: desde || undefined, to: hasta || undefined, status: estado || undefined }),
    getSuppliers(),
    getPurchases({ q: q || undefined, supplierId: proveedor || undefined, from: desde || undefined, to: hasta || undefined }),
  ]);
  const message = (sp as any).message;
  return (
    <div className="container mx-auto p-4 space-y-4">
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
        <div className="flex gap-2">
          <a href="/dashboard/admin/compras/carga" className="bg-emerald-600 text-white px-3 py-1 rounded">Carga CSV</a>
          <a href="/dashboard/admin/compras/registro" className="bg-green-600 text-white px-3 py-1 rounded">Registrar compra (IA)</a>
          <a href="/dashboard/admin/compras/nueva" className="bg-blue-600 text-white px-3 py-1 rounded">Nueva OC</a>
        </div>
      </div>
      {message && <div className="border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">{message}</div>}

      <form method="get" className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-700">N° Orden / ID</label>
          <input name="q" defaultValue={q} placeholder="Ej: 1a2b3c o 9F8E7D" className="form-input" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Proveedor</label>
          <select name="proveedor" defaultValue={proveedor} className="form-select">
            <option value="">Todos</option>
            {suppliers.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Desde</label>
          <input type="date" name="desde" defaultValue={desde} className="form-input" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Hasta</label>
          <input type="date" name="hasta" defaultValue={hasta} className="form-input" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Estado</label>
          <select name="estado" defaultValue={estado} className="form-select">
            <option value="">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="ORDERED">Ordenada</option>
            <option value="RECEIVED">Recibida</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>
        <div className="form-actions">
          <button className="bg-blue-600 text-white px-3 py-1 rounded">Aplicar</button>
          <a className="px-3 py-1 rounded border" href="/dashboard/admin/compras">Limpiar</a>
        </div>
      </form>

      <div className="flex justify-end">
        <a
          className="px-3 py-1 rounded border"
          target="_blank"
          href={`/api/reports/purchase-orders?${new URLSearchParams({ q, supplierId: proveedor, from: desde, to: hasta, status: estado }).toString()}`}
        >
          Exportar CSV
        </a>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">OC</th>
                <th className="px-3 py-2">Proveedor</th>
                <th className="px-3 py-2">Creada por</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Total USD</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po: any) => (
                <tr key={po.id}>
                  <td className="border px-3 py-2">{po.id.slice(-6)}</td>
                  <td className="border px-3 py-2">{po.supplier?.name}</td>
                  <td className="border px-3 py-2">{po.createdBy?.name || po.createdBy?.email || '—'}</td>
                  <td className="border px-3 py-2 text-center">{po.status}</td>
                  <td className="border px-3 py-2 text-right">{Number(po.totalUSD).toFixed(2)}</td>
                  <td className="border px-3 py-2">{new Date(po.createdAt).toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">
                    <a className="text-blue-600 hover:underline" href={`/dashboard/admin/compras/${po.id}`}>
                      Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Compras registradas (IA)</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Compra</th>
                <th className="px-3 py-2">Proveedor</th>
                <th className="px-3 py-2">Creada por</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Total USD</th>
                <th className="px-3 py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p: any) => (
                <tr key={p.id}>
                  <td className="border px-3 py-2">{p.id.slice(-6)}</td>
                  <td className="border px-3 py-2">{p.supplier?.name || '-'}</td>
                  <td className="border px-3 py-2">{p.createdBy?.name || p.createdBy?.email || '-'}</td>
                  <td className="border px-3 py-2 text-center">{p.items?.length || 0}</td>
                  <td className="border px-3 py-2 text-right">{Number(p.totalUSD || p.subtotalUSD || 0).toFixed(2)}</td>
                  <td className="border px-3 py-2">{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td className="px-3 py-2 text-sm text-gray-500" colSpan={6}>No hay compras registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
