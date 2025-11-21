import { getSuppliers } from "@/server/actions/procurement";
import PurchaseEntryForm from "@/components/admin/purchase-entry-form";
import { getSettings } from "@/server/actions/settings";
import { getBankAccounts } from "@/server/actions/banking";

export default async function RegistroCompraPage() {
  const [suppliers, settings, bankAccounts] = await Promise.all([
    getSuppliers(),
    getSettings(),
    getBankAccounts().catch(() => []),
  ]);
  const ivaPercent = Number((settings as any)?.ivaPercent || 16);
  const defaultMargins = {
    client: Number((settings as any)?.defaultMarginClientPct || 40),
    ally: Number((settings as any)?.defaultMarginAllyPct || 30),
    wholesale: Number((settings as any)?.defaultMarginWholesalePct || 20),
  };
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Entrada de productos</h1>
      <PurchaseEntryForm
        suppliers={suppliers}
        defaultTasa={Number((settings as any)?.tasaVES || 0)}
        defaultIvaPercent={ivaPercent}
        bankAccounts={bankAccounts as any}
        defaultMargins={defaultMargins}
      />
    </div>
  );
}
