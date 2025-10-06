import { getQuoteById } from "@/server/actions/quotes";
import { getSettings } from "@/server/actions/settings";
import PrintButton from "@/components/print-button";

export default async function PrintQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, settings] = await Promise.all([getQuoteById(id), getSettings()]);
  if (!quote) return <div className="p-4">Presupuesto no encontrado</div>;

  return (
    <div className="p-6 text-sm">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="space-x-2">
          <a className="px-3 py-1 border rounded" href={`/dashboard/admin/presupuestos/${quote.id}`}>Volver</a>
        </div>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto bg-white p-6 border rounded print:border-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xl font-bold">{(settings as any).brandName || 'Carpihogar.ai'}</div>
            <div className="text-gray-600">{(settings as any).contactEmail} · {String((settings as any).contactPhone)}</div>
          </div>
          {(settings as any).logoUrl && (
            <img src={(settings as any).logoUrl} alt="logo" className="h-10" />
          )}
        </div>

        <div className="flex justify-between mb-4">
          <div>
            <div className="font-semibold">Presupuesto</div>
            <div className="text-gray-600">ID: {quote.id}</div>
            <div className="text-gray-600">Fecha: {new Date(quote.createdAt as any).toLocaleString()}</div>
            <div className="text-gray-600">IVA: {Number(quote.ivaPercent).toFixed(2)}%</div>
          </div>
          <div>
            <div className="font-semibold">Cliente</div>
            <div>{quote.user?.name || quote.user?.email}</div>
            {quote.customerTaxId && (<div className="text-gray-600">Cédula/RIF: {quote.customerTaxId}</div>)}
            {quote.customerFiscalAddress && (<div className="text-gray-600">Dirección: {quote.customerFiscalAddress}</div>)}
          </div>
        </div>

        <table className="w-full table-auto text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-2 py-1">Producto</th>
              <th className="text-right px-2 py-1">Precio</th>
              <th className="text-right px-2 py-1">Cant.</th>
              <th className="text-right px-2 py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((it: any) => {
              const priceUSD = Number(it.priceUSD);
              const subUSD = priceUSD * Number(it.quantity);
              return (
                <tr key={it.id}>
                  <td className="border px-2 py-1">{it.name}</td>
                  <td className="border px-2 py-1 text-right">${priceUSD.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{it.quantity}</td>
                  <td className="border px-2 py-1 text-right">${subUSD.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between"><span>Subtotal</span><span>${Number(quote.subtotalUSD).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>IVA ({Number(quote.ivaPercent).toFixed(2)}%)</span><span>${(Number(quote.totalUSD)-Number(quote.subtotalUSD)).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold border-t mt-1 pt-1"><span>Total</span><span>${Number(quote.totalUSD).toFixed(2)}</span></div>
          </div>
        </div>

        <div className="text-gray-500 text-xs mt-6">Este es un presupuesto informativo. Precios sujetos a cambio sin previo aviso.</div>
      </div>
    </div>
  );
}

