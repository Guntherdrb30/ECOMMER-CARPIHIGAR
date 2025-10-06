import { getSales, getCommissions, getSellers, markCommissionPaid } from "@/server/actions/sales";

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

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Ventas</h1>
      {message && (
        <div className="border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">{message}</div>
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
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Vendedor</th>
                <th className="px-4 py-2">Total USD</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Pago</th>
                <th className="px-4 py-2">Imprimir</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="border px-4 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="border px-4 py-2">{o.user?.name || o.user?.email}</td>
                  <td className="border px-4 py-2">{o.seller?.name || '-'}</td>
                  <td className="border px-4 py-2">{Number(o.totalUSD).toFixed(2)}</td>
                  <td className="border px-4 py-2">{o.status}</td>
                  <td className="border px-4 py-2 text-sm">
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
                  <td className="border px-4 py-2 text-sm">
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
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">Comisiones</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Vendedor</th>
                <th className="px-4 py-2">Orden</th>
                <th className="px-4 py-2">%</th>
                <th className="px-4 py-2">Monto USD</th>
                <th className="px-4 py-2">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c: any) => (
                <tr key={c.id}>
                  <td className="border px-4 py-2">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="border px-4 py-2">{c.seller?.name || c.seller?.email}</td>
                  <td className="border px-4 py-2">{c.orderId}</td>
                  <td className="border px-4 py-2">{Number(c.percent).toFixed(2)}</td>
                  <td className="border px-4 py-2">{Number(c.amountUSD).toFixed(2)}</td>
                  <td className="border px-4 py-2">
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
      </div>
    </div>
  );
}
