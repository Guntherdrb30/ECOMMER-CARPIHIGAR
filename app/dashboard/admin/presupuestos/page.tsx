import { getQuotes, updateQuoteStatusByForm } from "@/server/actions/quotes";
import { getSellers } from "@/server/actions/sales";

export default async function PresupuestosPage({ searchParams }: { searchParams?: Promise<{ message?: string; q?: string; estado?: string; vendedor?: string; desde?: string; hasta?: string }> }) {
  const sp = (await searchParams) || ({} as any);
  const q = String((sp as any).q || '');
  const estado = String((sp as any).estado || '');
  const vendedor = String((sp as any).vendedor || '');
  const desde = String((sp as any).desde || '');
  const hasta = String((sp as any).hasta || '');
  const [quotes, sellers] = await Promise.all([
    getQuotes({ q: q || undefined, status: estado || undefined, sellerId: vendedor || undefined, from: desde || undefined, to: hasta || undefined }),
    getSellers(),
  ]);
  const message = (sp as any).message;
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <a href="/dashboard/admin/presupuestos/nuevo" className="bg-blue-600 text-white px-3 py-1 rounded">Nuevo Presupuesto</a>
      </div>
      {message && <div className="border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">{message}</div>}

      <form method="get" className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-700">Buscar</label>
          <input name="q" defaultValue={q} placeholder="ID, cliente o email" className="form-input" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Estado</label>
          <select name="estado" defaultValue={estado} className="form-select">
            <option value="">Todos</option>
            <option value="BORRADOR">Borrador</option>
            <option value="ENVIADO">Enviado</option>
            <option value="APROBADO">Aprobado</option>
            <option value="RECHAZADO">Rechazado</option>
            <option value="VENCIDO">Vencido</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Vendedor</label>
          <select name="vendedor" defaultValue={vendedor} className="form-select">
            <option value="">Todos</option>
            {sellers.map((s: any) => (<option key={s.id} value={s.id}>{s.name || s.email}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Desde</label>
          <input type="date" name="desde" defaultValue={desde} className="form-input" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Hasta</label>
          <input type="date" name="hasta" defaultValue={hasta} className="form-input" />
        </div>
        <div className="form-actions">
          <button className="bg-blue-600 text-white px-3 py-1 rounded">Aplicar</button>
          <a className="px-3 py-1 rounded border" href="/dashboard/admin/presupuestos">Limpiar</a>
        </div>
      </form>

      <div className="flex justify-end">
        <a
          className="px-3 py-1 rounded border"
          target="_blank"
          href={`/api/reports/quotes?${new URLSearchParams({ q, status: estado, sellerId: vendedor, from: desde, to: hasta }).toString()}`}
        >
          Exportar CSV
        </a>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Vendedor</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Vence</th>
                <th className="px-3 py-2">Total USD</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q: any) => (
                <tr key={q.id}>
                  <td className="border px-3 py-2">{q.id.slice(-6)}</td>
                  <td className="border px-3 py-2">{q.user?.name || q.user?.email}</td>
                  <td className="border px-3 py-2">{q.seller?.name || q.seller?.email || '—'}</td>
                  <td className="border px-3 py-2 text-center">{q.status}</td>
                  <td className="border px-3 py-2">{q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : '—'}</td>
                  <td className="border px-3 py-2 text-right">{Number(q.totalUSD).toFixed(2)}</td>
                  <td className="border px-3 py-2">{new Date(q.createdAt).toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right space-x-2">
                    <a className="text-blue-600 hover:underline" href={`/dashboard/admin/presupuestos/${q.id}`}>Ver</a>
                    <a className="text-blue-600 hover:underline" href={`/api/quotes/${q.id}/send`} target="_blank">Enviar</a>
                    <form action={updateQuoteStatusByForm} className="inline">
                      <input type="hidden" name="quoteId" value={q.id} />
                      <input type="hidden" name="status" value="APROBADO" />
                      <button className="text-green-700 hover:underline" type="submit">Aprobar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
