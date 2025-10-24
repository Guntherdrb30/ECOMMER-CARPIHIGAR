import { getAllyKpis, getAllySalesSeries, getAllyTopProducts } from "@/server/actions/ally";
import { AllySalesSeriesChart, AllyTopProductsChart } from "@/components/aliado/ally-charts";

export default async function ReportesAliadoPage() {
  const [kpis, series, top] = await Promise.all([
    getAllyKpis(),
    getAllySalesSeries(),
    getAllyTopProducts(),
  ]);
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Reportes de Aliado</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Ventas Totales</div>
          <div className="text-2xl font-semibold">${kpis.totalRevenueUSD.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Ganancia Estimada</div>
          <div className="text-2xl font-semibold">${kpis.totalProfitUSD.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Ventas Realizadas</div>
          <div className="text-2xl font-semibold">{kpis.ordersCount}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AllySalesSeriesChart data={series as any} />
        <AllyTopProductsChart data={(top as any)} />
      </div>
      <div className="text-sm text-gray-600">La ganancia estimada se calcula como la diferencia entre el precio de venta y el precio aliado (P2) configurado por producto.</div>
    </div>
  );
}
