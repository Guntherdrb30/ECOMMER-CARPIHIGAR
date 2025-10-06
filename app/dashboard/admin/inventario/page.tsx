import { getInventorySummary } from "@/server/actions/inventory";
import { getCategories } from "@/server/actions/categories";
import ProductQuickSearch from "@/components/admin/product-quick-search";
import TopSupplierKPI from "@/components/admin/top-supplier-kpi";
import LowStockPanel from "@/components/admin/low-stock-panel";
import RecentMovesPanel from "@/components/admin/recent-moves-panel";
import InventoryRefreshButton from "@/components/admin/inventory-refresh-button";
import TopSoldPanel from "@/components/admin/top-sold-panel";
import LeastSoldPanel from "@/components/admin/least-sold-panel";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    days?: string;
    top?: string;
    low?: string;
    cat?: string;
  }>;
}) {
  const sp = (await searchParams) || ({} as any);
  const days = Number(sp.days ?? 30);
  const topLimit = Number(sp.top ?? 10);
  const lowLimit = Number(sp.low ?? 10);
  const cat = (sp.cat ?? '') as string;

  const [summary, categories] = await Promise.all([
    getInventorySummary(),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <InventoryRefreshButton />
      </div>

      {/* BÃºsqueda rÃ¡pida */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">BÃºsqueda de productos</h2>
        <ProductQuickSearch />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Productos</div>
          <div className="text-2xl font-bold">{summary.productsCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Unidades en stock</div>
          <div className="text-2xl font-bold">{summary.totalUnits}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">ValorizaciÃ³n (USD)</div>
          <div className="text-2xl font-bold">
            {Number((summary as any).totalValueUSD ?? 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">
            Bajo stock (= {summary.lowStockThreshold})
          </div>
          <div className="text-2xl font-bold">{summary.lowStockCount}</div>
        </div>
        <TopSupplierKPI />
      </div>

      {/* Filtros de reportes */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Reportes de ventas</h2>
          <form method="get" className="flex items-center gap-2 text-sm">
            <label className="text-gray-700">DÃ­as</label>
            <input
              type="number"
              name="days"
              defaultValue={days}
              className="w-20 border rounded px-2 py-1"
            />
            <label className="text-gray-700">Top</label>
            <input
              type="number"
              name="top"
              defaultValue={topLimit}
              className="w-20 border rounded px-2 py-1"
            />
            <label className="text-gray-700">Low</label>
            <input
              type="number"
              name="low"
              defaultValue={lowLimit}
              className="w-20 border rounded px-2 py-1"
            />
            <label className="text-gray-700">CategorÃ­a</label>
            <select name="cat" defaultValue={cat} className="border rounded px-2 py-1">
              <option value="">Todas</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button className="bg-blue-600 text-white px-3 py-1 rounded">Aplicar</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <TopSoldPanel />
          </div>
          <div>
            <LeastSoldPanel />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <LowStockPanel />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <RecentMovesPanel />
        </div>
      </div>
    </div>
  );
}

