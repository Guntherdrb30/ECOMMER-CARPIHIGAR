import { getCategories } from "@/server/actions/categories";
import { getSuppliers } from "@/server/actions/procurement";
import { getInventoryValuation } from "@/server/actions/inventory";

export default async function ValuacionInventarioPage({ searchParams }: { searchParams?: Promise<{ proveedor?: string; categoria?: string; q?: string }> }) {
  const sp = (await searchParams) || {} as any;
  const proveedor = sp.proveedor || '';
  const categoria = sp.categoria || '';
  const q = sp.q || '';
  let suppliers: any[] = [];
  let categories: any[] = [];
  let data: any = { rows: [], totalValueUSD: 0 };
  try {
    const r = await Promise.all([
      getSuppliers(),
      getCategories(),
      getInventoryValuation({ supplierId: proveedor || undefined, categorySlug: categoria || undefined, q: q || undefined }),
    ]);
    suppliers = Array.isArray(r[0]) ? r[0] : [];
    categories = Array.isArray(r[1]) ? r[1] : [];
    data = r[2] || data;
  } catch {}

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Valorización de Inventario</h1>
      <form method="get" className="form-card form-grid">
        <select name="proveedor" defaultValue={proveedor} className="form-select">
          <option value="">Todos los proveedores</option>
          {suppliers.map((s: any) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
        <select name="categoria" defaultValue={categoria} className="form-select">
          <option value="">Todas las categorías</option>
          {categories.map((c: any) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
        </select>
        <input name="q" defaultValue={q} placeholder="Buscar por nombre o SKU" className="form-input" />
        <div className="form-actions">
          <button className="bg-blue-600 text-white px-3 py-1 rounded">Aplicar</button>
          <a href="/dashboard/admin/inventario/valuacion" className="px-3 py-1 rounded border">Limpiar</a>
          <a className="px-3 py-1 rounded border" target="_blank" href={`/api/reports/inventory-valuation?proveedor=${encodeURIComponent(proveedor)}&categoria=${encodeURIComponent(categoria)}&q=${encodeURIComponent(q)}`}>CSV</a>
          <a className="px-3 py-1 rounded border" target="_blank" href={`/dashboard/admin/inventario/valuacion/print?proveedor=${encodeURIComponent(proveedor)}&categoria=${encodeURIComponent(categoria)}&q=${encodeURIComponent(q)}`}>Imprimir</a>
          {data.rows.length > 0 && (
            <>
              <a className="px-3 py-1 rounded border" target="_blank" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(data.rows.map((r:any)=>`${r.name} (${r.sku||'—'}) · $${r.unitCostUSD.toFixed(2)} · stk:${r.stock} = $${r.totalValueUSD.toFixed(2)}`).join('\n') + '\nTOTAL: $' + data.totalValueUSD.toFixed(2))}`}>WhatsApp</a>
              <a className="px-3 py-1 rounded border" href={`mailto:?subject=${encodeURIComponent('Valorización de inventario')}&body=${encodeURIComponent(data.rows.map((r:any)=>`${r.name} (${r.sku||'—'}) · $${r.unitCostUSD.toFixed(2)} · stk:${r.stock} = $${r.totalValueUSD.toFixed(2)}`).join('\n') + '\nTOTAL: $' + data.totalValueUSD.toFixed(2))}`}>Email</a>
            </>
          )}
        </div>
      </form>

      <div className="form-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Detalle</h2>
          <div className="text-lg font-semibold">Total: ${data.totalValueUSD.toFixed(2)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Proveedor</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2 text-right">Stock</th>
                <th className="px-3 py-2 text-right">Costo USD</th>
                <th className="px-3 py-2 text-right">Total USD</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r: any) => (
                <tr key={r.id}>
                  <td className="border px-3 py-2">{r.name}</td>
                  <td className="border px-3 py-2 text-center">{r.sku || '—'}</td>
                  <td className="border px-3 py-2">{r.supplier || '—'}</td>
                  <td className="border px-3 py-2">{r.category || '—'}</td>
                  <td className="border px-3 py-2 text-right">{r.stock}</td>
                  <td className="border px-3 py-2 text-right">{r.unitCostUSD.toFixed(2)}</td>
                  <td className="border px-3 py-2 text-right">{r.totalValueUSD.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
