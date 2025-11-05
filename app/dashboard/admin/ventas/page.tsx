import { getSales, getCommissions, getSellers, markCommissionPaid } from "@/server/actions/sales";
import { getAllyPendingSalesCount } from "@/server/actions/ally-admin";

export default async function AdminSalesPage({ searchParams }: { searchParams?: Promise<{ sellerId?: string; message?: string; invoice?: string; cliente?: string; rif?: string }> }) {
  const sp = (await searchParams) || {} as any;
  const sellerId = sp.sellerId || '';
  const message = sp.message || '';
  const invoiceQ = String(sp.invoice || '').trim();
  const clienteQ = String(sp.cliente || '').trim();
  const rifQ = String(sp.rif || '').trim();
  const [orders, commissions, sellers] = await Promise.all([
    getSales({ sellerId: sellerId || undefined, invoice: invoiceQ || undefined, cliente: clienteQ || undefined, rif: rifQ || undefined }),
    getCommissions({ sellerId: sellerId || undefined }),
    getSellers(),
  ]);
  let allyPendingCount = 0;
  try { allyPendingCount = await getAllyPendingSalesCount(); } catch {}

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Ventas</h1>
      {message && (
        <div className="border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">{message}</div>
      )}
      {allyPendingCount > 0 && (
        <div className="border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 rounded">
          Hay {allyPendingCount} venta{allyPendingCount === 1 ? '' : 's'} de aliados por verificar.{' '}
          <a href="/dashboard/admin/ventas/aliados" className="underline">Revisar ahora</a>
        </div>
      )}
      <form method="get" className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-1">
          <select name="sellerId" defaultValue={sellerId} className="border rounded px-2 py-1 w-full">
            <option value="">Todos los vendedores</option>
            {sellers.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name || s.email}</option>
            ))}
          </select>
        </div>
        <div>
          <input name="invoice" defaultValue={invoiceQ} placeholder="Factura/Orden" className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <input name="cliente" defaultValue={clienteQ} placeholder="Cliente (nombre/email)" className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <input name="rif" defaultValue={rifQ} placeholder="Cédula/RIF" className="border rounded px-2 py-1 w-full" />
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-3 py-1 rounded">Filtrar</button>
          <a href="/dashboard/admin/ventas" className="px-3 py-1 rounded border text-gray-700">Limpiar</a>
        </div>
      </form>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">Listado de Ventas</h2>
        <details className="rounded border border-gray-200" open>
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-700">Ver ventas</summary>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-2 py-1 text-left w-40">Fecha</th>
                <th className="px-2 py-1 text-left w-56">Cliente</th>
                <th className="px-2 py-1 text-left w-40">Vendedor</th>
                <th className="px-2 py-1 text-left w-28">Total USD</th>
                <th className="px-2 py-1 text-left w-32">Estado</th>
                <th className="px-2 py-1 text-left w-56">Pago</th>
                <th className="px-2 py-1 text-left">Imprimir</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-t">
                  <td className="px-2 py-1 align-top">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-2 py-1 align-top">{o.user?.name || o.user?.email}</td>
                  <td className="px-2 py-1 align-top">{o.seller?.name || '-'}</td>
                  <td className="px-2 py-1 align-top">{Number(o.totalUSD).toFixed(2)}</td>
                  <td className="px-2 py-1 align-top">{o.status}</td>
                  <td className="px-2 py-1 align-top text-sm">
                    {o.payment ? (
                      <div className="space-y-0.5">
                        <div>{o.payment.method} · {o.payment.currency}</div>
                        {o.payment.reference && <div>Ref: {o.payment.reference}</div>}
                        {o.payment.method === 'PAGO_MOVIL' && (
                          <div className="text-gray-600">
                            {o.payment.payerName && <div>Titular: {o.payment.payerName}</div>}
                            {o.payment.payerPhone && <div>Tel: {o.payment.payerPhone}</div>}
                            {o.payment.payerBank && <div>Banco: {o.payment.payerBank}</div>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1 align-top text-sm">
                    {(o.status === 'PAGADO' || o.status === 'COMPLETADO') ? (
                      <div className="flex flex-wrap gap-2">
                        <a className="text-blue-600 hover:underline" href={`/dashboard/admin/ventas/${o.id}/print?tipo=recibo&moneda=USD`}>Recibo USD</a>
                        <a className="text-blue-600 hover:underline" href={`/dashboard/admin/ventas/${o.id}/print?tipo=recibo&moneda=VES`}>Recibo Bs</a>
                        <a className="text-blue-600 hover:underline" href={`/dashboard/admin/ventas/${o.id}/print?tipo=nota&moneda=USD`}>Nota</a>
                        <a className="text-blue-600 hover:underline" href={`/dashboard/admin/ventas/${o.id}/print?tipo=factura&moneda=USD`}>Factura USD</a>
                        <a className="text-blue-600 hover:underline" href={`/dashboard/admin/ventas/${o.id}/print?tipo=factura&moneda=VES`}>Factura Bs</a>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </details>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">Comisiones</h2>
        <details className="rounded border border-gray-200" open>
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-700">Ver comisiones</summary>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-2 py-1 text-left w-40">Fecha</th>
                <th className="px-2 py-1 text-left w-48">Vendedor</th>
                <th className="px-2 py-1 text-left w-28">Orden</th>
                <th className="px-2 py-1 text-left w-16">%</th>
                <th className="px-2 py-1 text-left w-32">Monto USD</th>
                <th className="px-2 py-1 text-left">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="px-2 py-1 align-top">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="px-2 py-1 align-top">{c.seller?.name || c.seller?.email}</td>
                  <td className="px-2 py-1 align-top">{c.orderId}</td>
                  <td className="px-2 py-1 align-top">{Number(c.percent).toFixed(2)}</td>
                  <td className="px-2 py-1 align-top">{Number(c.amountUSD).toFixed(2)}</td>
                  <td className="px-2 py-1 align-top">
                    {c.status}
                    {c.status === 'PENDIENTE' && (
                      <form action={markCommissionPaid} className="inline-block ml-2">
                        <input type="hidden" name="commissionId" value={c.id} />
                        <button className="text-blue-600 hover:underline">Marcar pagada</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </details>
      </div>
    </div>
  );
}
