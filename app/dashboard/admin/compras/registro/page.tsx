import { getSuppliers } from "@/server/actions/procurement";
import PurchaseIAForm from "@/components/admin/purchase-ia-form";
import { getSettings } from "@/server/actions/settings";

export default async function RegistroCompraPage() {
  const [suppliers, settings] = await Promise.all([getSuppliers(), getSettings()]);
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Registrar compra (IA)</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600 mb-3">Sube la factura en PDF para precargar los productos y ajustar márgenes y precios antes de guardar.</p>
        <PurchaseIAForm suppliers={suppliers} defaultTasa={Number((settings as any)?.tasaVES || 0)} />
      </div>
    </div>
  );
}

