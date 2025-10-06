import QuoteForm from "@/components/admin/quote-form";
import { getSellers } from "@/server/actions/sales";
import { getSettings } from "@/server/actions/settings";
import { createQuote } from "@/server/actions/quotes";

export default async function NuevoPresupuestoPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const [sellers, settings] = await Promise.all([
    getSellers(),
    getSettings(),
  ]);
  const sp = (await searchParams) || ({} as any);
  const error = (sp as any).error;
  const iva = Number((settings as any).ivaPercent || 16);
  const tasa = Number((settings as any).tasaVES || 40);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Nuevo Presupuesto</h1>
      {error && <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">{error}</div>}
      <div className="bg-white p-4 rounded-lg shadow">
        <QuoteForm sellers={sellers} ivaPercent={iva} tasaVES={tasa} action={createQuote} />
      </div>
    </div>
  );
}

