import { getSuppliers } from "@/server/actions/procurement";
import PurchaseIAForm from "@/components/admin/purchase-ia-form";
import { getSettings } from "@/server/actions/settings";
import { getBankAccounts } from "@/server/actions/banking";

export default async function RegistroCompraPage() {
  const [suppliers, settings, bankAccounts] = await Promise.all([
    getSuppliers(),
    getSettings(),
    getBankAccounts().catch(() => []),
  ]);
  const ivaPercent = Number((settings as any)?.ivaPercent || 16);
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Registrar compra (IA)</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600 mb-3">
          Sube la factura en PDF para precargar los productos y ajustar márgenes, precios y datos legales antes de guardar.
        </p>
        <PurchaseIAForm
          suppliers={suppliers}
          defaultTasa={Number((settings as any)?.tasaVES || 0)}
          defaultIvaPercent={ivaPercent}
          bankAccounts={bankAccounts as any}
        />
      </div>
    </div>
  );
}

