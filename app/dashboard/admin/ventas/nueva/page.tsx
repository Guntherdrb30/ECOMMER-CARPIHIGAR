import OfflineSaleForm from "@/components/admin/offline-sale-form";
import { getSellers } from "@/server/actions/sales";
import { getSettings } from "@/server/actions/settings";
import { createOfflineSale } from "@/server/actions/sales";

export default async function NuevaVentaPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const sp = (await searchParams) || {} as any;
  const [sellers, settings] = await Promise.all([
    getSellers(),
    getSettings(),
  ]);
  const commission = Number((settings as any).sellerCommissionPercent || 5);
  const iva = Number((settings as any).ivaPercent || 16);
  const tasa = Number((settings as any).tasaVES || 40);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Nueva Venta (Tienda)</h1>
      {sp.error && (
        <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">{sp.error}</div>
      )}
      <div className="bg-white p-4 rounded-lg shadow">
        <OfflineSaleForm sellers={sellers} commissionPercent={commission} ivaPercent={iva} tasaVES={tasa} action={createOfflineSale} />
      </div>
    </div>
  );
}
