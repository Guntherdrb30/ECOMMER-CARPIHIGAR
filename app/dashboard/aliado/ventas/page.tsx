import { getMySalesAsAlly } from "@/server/actions/ally";
import { sendOrderWhatsAppByForm } from "@/server/actions/sales";

export default async function VentasAliadoPage({ searchParams }: { searchParams?: Promise<{ message?: string; orderId?: string }> }) {
  const sp = (await searchParams) || ({} as any);
  const message = (sp as any).message as string | undefined;
  const orderId = (sp as any).orderId as string | undefined;
  const orders = await getMySalesAsAlly();
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Ventas</h1>
        <a href="/dashboard/aliado/ventas/nueva" className="bg-green-600 text-white px-3 py-1 rounded">Nueva Venta</a>
      </div>
      {message && (
        <div className="flex items-center justify-between border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">
          <span>{message}</span>
          {orderId && (
            <form action={sendOrderWhatsAppByForm}>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="backTo" value="/dashboard/aliado/ventas" />
              <button className="px-3 py-1 rounded border">Enviar WhatsApp</button>
            </form>
          )}
        </div>
      )}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Estado</th>
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
                  <td className="border px-3 py-2 text-center">{o.status}</td>
                  <td className="border px-3 py-2 text-right">{Number(o.totalUSD).toFixed(2)}</td>
                  <td className="border px-3 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">
                    <form action={sendOrderWhatsAppByForm}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <input type="hidden" name="backTo" value="/dashboard/aliado/ventas" />
                      <button className="text-green-700 hover:underline" type="submit">WhatsApp</button>
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
