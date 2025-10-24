import QuoteForm from "@/components/admin/quote-form";
import { getSettings } from "@/server/actions/settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createQuote } from "@/server/actions/quotes";

export default async function NuevoPresupuestoAliadoPage() {
  const [settings, session] = await Promise.all([
    getSettings(),
    getServerSession(authOptions),
  ]);
  const iva = Number((settings as any).ivaPercent || 16);
  const tasa = Number((settings as any).tasaVES || 40);
  const me = { id: String((session?.user as any)?.id || ''), name: session?.user?.name || undefined, email: session?.user?.email || '' };
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Nuevo Presupuesto (Aliado)</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <QuoteForm sellers={[me]} ivaPercent={iva} tasaVES={tasa} action={createQuote} />
      </div>
    </div>
  );
}

