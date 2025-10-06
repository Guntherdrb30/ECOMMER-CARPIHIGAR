import { getCategories } from "@/server/actions/categories";
import { getSuppliers } from "@/server/actions/procurement";
import { getProducts } from "@/server/actions/products";
import { getSettings } from "@/server/actions/settings";
import PrintButton from "@/components/print-button";

export default async function PrintProductosPorProveedorInventario({
  searchParams,
}: { searchParams?: Promise<{ proveedor?: string; categoria?: string; q?: string }> }) {
  const sp = (await searchParams) || ({} as any);
  const proveedor = sp.proveedor || '';
  const categoria = sp.categoria || '';
  const q = sp.q || '';
  const [suppliers, categories, products, settings] = await Promise.all([
    getSuppliers(),
    getCategories(),
    getProducts({ supplierId: proveedor || undefined, categorySlug: categoria || undefined, q: q || undefined }),
    getSettings(),
  ]);
  const supplierName = suppliers.find((s: any) => s.id === proveedor)?.name || 'Todos';
  const categoryName = categories.find((c: any) => c.slug === categoria)?.name || 'Todas';

  return (
    <div className="p-6 text-sm">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="space-x-2">
          <a
            className="px-3 py-1 border rounded"
            href={`?proveedor=${encodeURIComponent(proveedor)}&categoria=${encodeURIComponent(categoria)}&q=${encodeURIComponent(q)}`}
          >
            Refrescar
          </a>
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
            <div className="text-xl font-bold">Productos por Proveedor</div>
            <div className="text-gray-600">Proveedor: {supplierName} · Categoría: {categoryName}</div>
          </div>
        </div>
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-2 py-1">Producto</th>
              <th className="text-left px-2 py-1">SKU</th>
              <th className="text-left px-2 py-1">Proveedor</th>
              <th className="text-left px-2 py-1">Categoría</th>
              <th className="text-right px-2 py-1">Precio USD</th>
              <th className="text-right px-2 py-1">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id}>
                <td className="border px-2 py-1">{p.name}</td>
                <td className="border px-2 py-1">{p.sku || '—'}</td>
                <td className="border px-2 py-1">{p.supplier?.name || '—'}</td>
                <td className="border px-2 py-1">{p.category?.name || '—'}</td>
                <td className="border px-2 py-1 text-right">{Number(p.priceUSD).toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
