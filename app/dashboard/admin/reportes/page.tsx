import { getKpis, getSalesSeries, getTopProducts, getSalesByCategory, getSalesBySeller, getReceivablesAging } from '@/server/actions/reports';
import { getInventorySummary } from '@/server/actions/inventory';
import KpiCards from '@/components/reports/kpi-cards';
import SalesOverTimeChart from '@/components/reports/sales-over-time-chart';
import SimpleBarChart from '@/components/reports/bar-chart';
import ReceivablesAgingChart from '@/components/reports/receivables-aging-chart';

export const dynamic = 'force-dynamic';

export default async function ReportesPage({ searchParams }: { searchParams?: { [k: string]: string | string[] | undefined } }) {
  const from = (searchParams?.from as string) || '';
  const to = (searchParams?.to as string) || '';
  const [kpis, series, topProducts, byCategory, bySeller, aging, inv] = await Promise.all([
    getKpis({ from, to }),
    getSalesSeries({ from, to }),
    getTopProducts({ from, to }, 10),
    getSalesByCategory({ from, to }, 10),
    getSalesBySeller({ from, to }),
    getReceivablesAging(),
    getInventorySummary(),
  ]);

  const kpiItems = [
    { label: 'Ingresos', value: `$${kpis.totalRevenueUSD.toFixed(2)}`, subtitle: 'Periodo seleccionado' },
    { label: 'Órdenes', value: String(kpis.ordersCount) },
    { label: 'Ticket Promedio', value: `$${kpis.avgOrderValueUSD.toFixed(2)}` },
    { label: 'Órdenes Pagadas', value: String(kpis.paidOrders) },
    { label: 'Ventas a Crédito', value: String(kpis.creditOrders) },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4">
      <h1 className="text-2xl font-bold">Reportes</h1>

      {/* Filters */}
      <form method="get" className="bg-white rounded-lg shadow p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-gray-600">Desde</label>
          <input type="date" name="from" defaultValue={from} className="border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Hasta</label>
          <input type="date" name="to" defaultValue={to} className="border rounded px-3 py-2" />
        </div>
        <button className="bg-gray-900 text-white px-3 py-2 rounded">Aplicar</button>
        {(from || to) && <a href="/dashboard/admin/reportes" className="px-3 py-2 border rounded">Limpiar</a>}
        <div className="ml-auto text-sm text-gray-500">Inventario: {inv.totalUnits.toLocaleString()} uds • ${inv.totalValueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      </form>

      <KpiCards items={kpiItems} />

      {/* Export toolbar */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <a className="underline" href={`/api/reports/analytics/summary/pdf?from=${from}&to=${to}`} target="_blank" rel="noopener noreferrer">Descargar resumen (PDF)</a>
        <span className="text-gray-400">|</span>
        <a className="underline" href={`/api/reports/analytics/sales-series?from=${from}&to=${to}`} target="_blank" rel="noopener noreferrer">Series de ventas (CSV)</a>
        <a className="underline" href={`/api/reports/analytics/top-products?from=${from}&to=${to}`} target="_blank" rel="noopener noreferrer">Top productos (CSV)</a>
        <a className="underline" href={`/api/reports/analytics/sales-by-category?from=${from}&to=${to}`} target="_blank" rel="noopener noreferrer">Por categoría (CSV)</a>
        <a className="underline" href={`/api/reports/analytics/sales-by-seller?from=${from}&to=${to}`} target="_blank" rel="noopener noreferrer">Por vendedor (CSV)</a>
        <a className="underline" href={`/api/reports/analytics/aging`} target="_blank" rel="noopener noreferrer">Antigüedad CxC (CSV)</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesOverTimeChart data={series} />
        <ReceivablesAgingChart data={aging} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SimpleBarChart title="Top Productos (USD)" data={topProducts.map(p => ({ name: p.name, value: Number(p.revenueUSD || 0) }))} valueLabel="USD" currency />
        <SimpleBarChart title="Ventas por Categoría (USD)" data={byCategory.map(c => ({ name: c.category, value: Number(c.revenueUSD || 0) }))} valueLabel="USD" currency />
        <SimpleBarChart title="Ventas por Vendedor (USD)" data={bySeller.map(s => ({ name: s.seller, value: Number(s.revenueUSD || 0) }))} valueLabel="USD" currency />
      </div>
    </div>
  );
}
