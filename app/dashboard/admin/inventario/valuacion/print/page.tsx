import { getCategories } from "@/server/actions/categories";
import { getSuppliers } from "@/server/actions/procurement";
import { getInventoryValuation } from "@/server/actions/inventory";
import { getSettings } from "@/server/actions/settings";
import PrintButton from "@/components/print-button";

export default async function PrintValuacionInventario({ searchParams }: { searchParams?: Promise<{ proveedor?: string; categoria?: string; q?: string }> }) {
  const sp = (await searchParams) || {} as any;
  const proveedor = sp.proveedor || '';
  const categoria = sp.categoria || '';
  const q = sp.q || '';
  let suppliers: any[] = [];
  let categories: any[] = [];
  let data: any = { rows: [], totalValueUSD: 0 };
  let settings: any = {};
  try {
    const r = await Promise.all([
      getSuppliers(),
      getCategories(),
      getInventoryValuation({ supplierId: proveedor || undefined, categorySlug: categoria || undefined, q: q || undefined }),
      getSettings(),
    ]);
    suppliers = Array.isArray(r[0]) ? r[0] : [];
    categories = Array.isArray(r[1]) ? r[1] : [];
    data = r[2] || data;
    settings = r[3] || {};
  } catch {}
  const supplierName = suppliers.find((s: any) => s.id === proveedor)?.name || 'Todos';
  const categoryName = categories.find((c: any) => c.slug === categoria)?.name || 'Todas';

  return (
    <div className="p-6 text-sm">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="space-x-2">
          <a className="px-3 py-1 border rounded" href={`?proveedor=${encodeURIComponent(proveedor)}&categoria=${encodeURIComponent(categoria)}&q=${encodeURIComponent(q)}`}>Refrescar</a>
        </div>
        <PrintButton />
      </div>
      <div className="max-w-5xl mx-auto bg-white p-6 border rounded print:border-0">
        {(settings as any).logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <div className="flex justify-end mb-2">
            <img src={(settings as any).logoUrl} alt="logo" className="h-10" />
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xl font-bold">Valorización de Inventario</div>
            <div className="text-gray-600">Proveedor: {supplierName} · Categoría: {categoryName}</div>
          </div>
          <div className="text-lg font-semibold">Total: ${data.totalValueUSD.toFixed(2)}</div>
        </div>
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-2 py-1">Producto</th>
              <th className="text-left px-2 py-1">SKU</th>
              <th className="text-left px-2 py-1">Proveedor</th>
              <th className="text-left px-2 py-1">Categoría</th>
              <th className="text-right px-2 py-1">Stock</th>
              <th className="text-right px-2 py-1">Costo USD</th>
              <th className="text-right px-2 py-1">Total USD</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.name}</td>
                <td className="border px-2 py-1">{r.sku || '—'}</td>
                <td className="border px-2 py-1">{r.supplier || '—'}</td>
                <td className="border px-2 py-1">{r.category || '—'}</td>
                <td className="border px-2 py-1 text-right">{r.stock}</td>
                <td className="border px-2 py-1 text-right">{r.unitCostUSD.toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{r.totalValueUSD.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
