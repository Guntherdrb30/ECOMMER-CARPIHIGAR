import { getTopSoldProducts, getLeastSoldProducts } from "@/server/actions/inventory";
import { getSettings } from "@/server/actions/settings";
import PrintButton from "@/components/print-button";

export default async function PrintInventoryReport({ searchParams }: { searchParams?: Promise<{ tipo?: string; days?: string; limit?: string }> }) {
  const sp = (await searchParams) || {} as any;
  const tipo = (sp.tipo || 'top').toLowerCase();
  const days = Number(sp.days || 30);
  const limit = Number(sp.limit || 10);
  const [data, settings] = await Promise.all([
    (tipo === 'low' ? getLeastSoldProducts(days, limit) : getTopSoldProducts(days, limit)),
    getSettings(),
  ]);
  const title = tipo === 'low' ? 'Menos vendidos' : 'Más vendidos';

  return (
    <div className="p-6 text-sm">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="space-x-2">
          <a className="px-3 py-1 border rounded" href={`?tipo=${tipo}&days=7&limit=${limit}`}>7d</a>
          <a className="px-3 py-1 border rounded" href={`?tipo=${tipo}&days=30&limit=${limit}`}>30d</a>
          <a className="px-3 py-1 border rounded" href={`?tipo=${tipo}&days=90&limit=${limit}`}>90d</a>
        </div>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto bg-white p-6 border rounded print:border-0">
        {(settings as any).logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <div className="flex justify-end mb-2">
            <img src={(settings as any).logoUrl} alt="logo" className="h-10" />
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xl font-bold">Reporte de Inventario</div>
            <div className="text-gray-600">{title} · últimos {days} días</div>
          </div>
        </div>

        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-2 py-1">#</th>
              <th className="text-left px-2 py-1">Producto</th>
              <th className="text-left px-2 py-1">SKU</th>
              <th className="text-right px-2 py-1">Vendidos</th>
            </tr>
          </thead>
          <tbody>
            {data.map((x: any, idx: number) => (
              <tr key={x.product.id}>
                <td className="border px-2 py-1">{idx + 1}</td>
                <td className="border px-2 py-1">{x.product.name}</td>
                <td className="border px-2 py-1">{x.product.sku || '—'}</td>
                <td className="border px-2 py-1 text-right">{x.soldQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
