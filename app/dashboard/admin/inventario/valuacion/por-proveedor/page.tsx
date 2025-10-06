import { getCategories } from "@/server/actions/categories";
import { getSuppliers } from "@/server/actions/procurement";
import { getInventoryValuationBySupplier, getTopSuppliersByInventory } from "@/server/actions/inventory";

export default async function ValuacionPorProveedorPage({ searchParams }: { searchParams?: Promise<{ proveedor?: string; categoria?: string; q?: string }> }) {
  const sp = (await searchParams) || {} as any;
  const proveedor = sp.proveedor || '';
  const categoria = sp.categoria || '';
  const q = sp.q || '';
  const [suppliers, categories, data, top] = await Promise.all([
    getSuppliers(),
    getCategories(),
    getInventoryValuationBySupplier({ supplierId: proveedor || undefined, categorySlug: categoria || undefined, q: q || undefined }),
    getTopSuppliersByInventory({ categorySlug: categoria || undefined, q: q || undefined, limit: 5 }),
  ]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Valorización por Proveedor</h1>
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
          <a href="/dashboard/admin/inventario/valuacion/por-proveedor" className="px-3 py-1 rounded border">Limpiar</a>
          <a className="px-3 py-1 rounded border" target="_blank" href={`/api/reports/inventory-valuation-by-supplier?proveedor=${encodeURIComponent(proveedor)}&categoria=${encodeURIComponent(categoria)}&q=${encodeURIComponent(q)}`}>CSV</a>
          <a className="px-3 py-1 rounded border" target="_blank" href={`/dashboard/admin/inventario/valuacion/por-proveedor/print?proveedor=${encodeURIComponent(proveedor)}&categoria=${encodeURIComponent(categoria)}&q=${encodeURIComponent(q)}`}>Imprimir</a>
          {data.groups.length > 0 && (
            <>
              <a className="px-3 py-1 rounded border" target="_blank" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(data.groups.map((g:any)=>`Proveedor: ${g.supplier}\n` + g.rows.map((r:any)=>`  - ${r.name} (${r.sku||'—'}) · $${r.unitCostUSD.toFixed(2)} · stk:${r.stock} = $${r.totalValueUSD.toFixed(2)}`).join('\n') + `\nSubtotal: $${g.subtotalUSD.toFixed(2)}`).join('\n\n') + `\nTOTAL: $${data.totalValueUSD.toFixed(2)}`)}`}>WhatsApp</a>
              <a className="px-3 py-1 rounded border" href={`mailto:?subject=${encodeURIComponent('Valorización por proveedor')}&body=${encodeURIComponent(data.groups.map((g:any)=>`Proveedor: ${g.supplier}\n` + g.rows.map((r:any)=>`  - ${r.name} (${r.sku||'—'}) · $${r.unitCostUSD.toFixed(2)} · stk:${r.stock} = $${r.totalValueUSD.toFixed(2)}`).join('\n') + `\nSubtotal: $${g.subtotalUSD.toFixed(2)}`).join('\n\n') + `\nTOTAL: $${data.totalValueUSD.toFixed(2)}`)}`}>Email</a>
            </>
          )}
        </div>
      </form>

      <div className="form-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Top Proveedores por valor (USD)</h2>
          <div className="form-actions">
            <a className="px-3 py-1 rounded border" target="_blank" href={`/api/reports/top-suppliers-inventory?categoria=${encodeURIComponent(categoria)}&q=${encodeURIComponent(q)}`}>CSV</a>
            {top.rows.length > 0 && (
              <>
                <a className="px-3 py-1 rounded border" target="_blank" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(top.rows.map((r:any,i:number)=>`${i+1}. ${r.supplier}: $${r.totalValueUSD.toFixed(2)}`).join('\n'))}`}>WhatsApp</a>
                <a className="px-3 py-1 rounded border" href={`mailto:?subject=${encodeURIComponent('Top proveedores por valor de inventario')}&body=${encodeURIComponent(top.rows.map((r:any,i:number)=>`${i+1}. ${r.supplier}: $${r.totalValueUSD.toFixed(2)}`).join('\n'))}`}>Email</a>
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Proveedor</th>
                <th className="px-3 py-2 text-right">Total USD</th>
              </tr>
            </thead>
            <tbody>
              {top.rows.map((r: any, idx: number) => (
                <tr key={r.supplier}>
                  <td className="border px-3 py-2">{idx + 1}</td>
                  <td className="border px-3 py-2">{r.supplier}</td>
                  <td className="border px-3 py-2 text-right">{r.totalValueUSD.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Detalle por proveedor</h2>
          <div className="text-lg font-semibold">Total: ${data.totalValueUSD.toFixed(2)}</div>
        </div>
        <div className="space-y-4">
          {data.groups.map((g: any) => (
            <div key={g.supplier} className="border rounded">
              <div className="px-3 py-2 bg-gray-50 font-semibold flex items-center justify-between">
                <span>{g.supplier}</span>
                <span>Subtotal: ${g.subtotalUSD.toFixed(2)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                      <th className="px-3 py-2 text-right">Costo USD</th>
                      <th className="px-3 py-2 text-right">Total USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r: any) => (
                      <tr key={r.id}>
                        <td className="border px-3 py-2">{r.name}</td>
                        <td className="border px-3 py-2 text-center">{r.sku || '—'}</td>
                        <td className="border px-3 py-2 text-right">{r.stock}</td>
                        <td className="border px-3 py-2 text-right">{r.unitCostUSD.toFixed(2)}</td>
                        <td className="border px-3 py-2 text-right">{r.totalValueUSD.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
