import { getAllyPendingSales } from "@/server/actions/ally-admin";
import { approveAllySaleByForm, rejectAllySaleByForm } from "@/server/actions/sales";

export default async function VentasAliadosVerificarPage() {
  const orders = await getAllyPendingSales();
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ventas de Aliados por Verificar</h1>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Aliado</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Pago</th>
                <th className="px-3 py-2">Total USD</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="border px-3 py-2">{o.id.slice(-6)}</td>
                  <td className="border px-3 py-2">{o.user?.name || o.user?.email}</td>
                  <td className="border px-3 py-2">{o.seller?.name || o.seller?.email}</td>
                  <td className="border px-3 py-2 text-center text-red-700">{o.status}</td>
                  <td className="border px-3 py-2 text-center">{o.payment ? `${o.payment.method} (${o.payment.status})` : '-'}</td>
                  <td className="border px-3 py-2 text-right">{Number(o.totalUSD).toFixed(2)}</td>
                  <td className="border px-3 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right space-x-2">
                    <form className="inline" action={approveAllySaleByForm}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <button className="text-green-700 hover:underline" type="submit">Aprobar</button>
                    </form>
                    <form className="inline" action={rejectAllySaleByForm}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <button className="text-red-700 hover:underline" type="submit">Rechazar</button>
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

