import OfflineSaleForm from "@/components/admin/offline-sale-form";
import { getSettings } from "@/server/actions/settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOfflineSale } from "@/server/actions/sales";
import { getAllyQuoteById } from "@/server/actions/quotes";

export default async function NuevaVentaAliadoPage({ searchParams }: { searchParams?: Promise<{ fromQuote?: string; shipping?: string }> }) {
  const sp = (await searchParams) || ({} as any);
  const [settings, session] = await Promise.all([
    getSettings(),
    getServerSession(authOptions),
  ]);
  const commission = Number((settings as any).sellerCommissionPercent || 5);
  const iva = Number((settings as any).ivaPercent || 16);
  const tasa = Number((settings as any).tasaVES || 40);
  const me = { id: String((session?.user as any)?.id || ''), name: session?.user?.name || undefined, email: session?.user?.email || '' };

  let initialItems: Array<{ productId: string; name: string; p1: number; p2?: number | null; priceUSD: number; quantity: number }> | undefined = undefined;
  const fromQuote = String((sp as any).fromQuote || '');
  if (fromQuote) {
    try {
      const quote = await getAllyQuoteById(fromQuote);
      initialItems = quote.items.map((it: any) => {
        const p1 = Number(it.priceUSD);
        const p2 = it.product?.priceAllyUSD != null ? Number(it.product.priceAllyUSD) : null;
        return { productId: it.productId, name: it.name, p1, p2, priceUSD: p1, quantity: Number(it.quantity) };
      });
    } catch {}
  }
  const initialShipping = (() => {
    const s = String((sp as any).shipping || '').toUpperCase();
    return (s === 'RETIRO_TIENDA' || s === 'DELIVERY') ? (s as any) : '';
  })();

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Nueva Venta (Aliado)</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <OfflineSaleForm sellers={[me]} commissionPercent={commission} ivaPercent={iva} tasaVES={tasa} action={createOfflineSale} initialItems={initialItems} fixedSellerId={me.id} initialShippingLocalOption={initialShipping} />
      </div>
    </div>
  );
}
