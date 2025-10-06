import { getMyOrderById } from "@/server/actions/orders";
import { sendReceiptEmailByForm } from "@/server/actions/email";

export default async function ClientePedidoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order: any = null;
  try {
    order = await getMyOrderById(id);
  } catch (e) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow">Pedido no encontrado</div>
      </div>
    );
  }

  const ivaPercent = Number(order.ivaPercent || 16);
  const subtotalUSD = Number(order.subtotalUSD || 0);
  const ivaUSD = (subtotalUSD * ivaPercent) / 100;
  const totalUSD = Number(order.totalUSD || (subtotalUSD + ivaUSD));
  const tasaVES = Number(order.tasaVES || 40);
  const totalVES = Number(order.totalVES || totalUSD * tasaVES);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedido {order.id.slice(-6)}</h1>
        <a href="/dashboard/cliente" className="text-sm border px-3 py-1 rounded">Volver</a>
      </div>

      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-gray-600 text-sm">Fecha</div>
          <div>{new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-600 text-sm">Estatus</div>
          <div className="font-semibold">{order.status}</div>
        </div>
        <div>
          <div className="text-gray-600 text-sm">Totales</div>
          <div>USD: ${totalUSD.toFixed(2)} · Bs: {(totalVES).toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">Items</h2>
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-right">Precio USD</th>
              <th className="px-3 py-2 text-right">Cant.</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it: any) => {
              const price = Number(it.priceUSD);
              const sub = price * Number(it.quantity);
              return (
                <tr key={it.id}>
                  <td className="border px-3 py-2">{it.name}</td>
                  <td className="border px-3 py-2 text-right">{price.toFixed(2)}</td>
                  <td className="border px-3 py-2 text-right">{it.quantity}</td>
                  <td className="border px-3 py-2 text-right">{sub.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex justify-end mt-3">
          <div className="w-64 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotalUSD.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>IVA ({ivaPercent}%)</span><span>${ivaUSD.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold border-t mt-1 pt-1"><span>Total</span><span>${totalUSD.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">Pago</h2>
        {order.payment ? (
          <div className="text-sm space-y-1">
            <div>Método: {order.payment.method}</div>
            <div>Moneda: {order.payment.currency}</div>
            {order.payment.reference && <div>Referencia: {order.payment.reference}</div>}
            {order.payment.method === 'PAGO_MOVIL' && (
              <div className="text-gray-700">
                {order.payment.payerName && <div>Titular: {order.payment.payerName}</div>}
                {order.payment.payerPhone && <div>Teléfono: {order.payment.payerPhone}</div>}
                {order.payment.payerBank && <div>Banco: {order.payment.payerBank}</div>}
              </div>
            )}
            <div>Estatus: {order.payment.status}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">Sin registro de pago</div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <a className="border px-3 py-1 rounded" href={`/dashboard/cliente/pedidos/${order.id}/print?tipo=recibo&moneda=USD`} target="_blank">Imprimir / PDF</a>
          <form action={sendReceiptEmailByForm} className="flex items-center gap-2">
            <input type="hidden" name="orderId" value={order.id} />
            <select name="tipo" className="border rounded px-2 py-1 text-sm">
              <option value="recibo">Recibo</option>
              <option value="nota">Nota</option>
              <option value="factura">Factura</option>
            </select>
            <select name="moneda" className="border rounded px-2 py-1 text-sm">
              <option value="USD">USD</option>
              <option value="VES">Bs (VES)</option>
            </select>
            <input name="to" type="email" defaultValue={order.user?.email || ''} placeholder="Email" className="border rounded px-2 py-1 text-sm" required />
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Enviar por email</button>
          </form>
        </div>
      </div>

      {order.shipping && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-2">Envío</h2>
          <div className="text-sm space-y-1">
            {order.shippingAddress && (
              <div>
                <h3 className="font-semibold">Dirección de Envío:</h3>
                <p>{order.shippingAddress.fullname}</p>
                <p>{order.shippingAddress.address1}, {order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.phone}</p>
              </div>
            )}
            <div><span className="font-semibold">Transportista:</span> {order.shipping.carrier}</div>
            {order.shipping.tracking && <div><span className="font-semibold">Tracking:</span> {order.shipping.tracking}</div>}
            <div><span className="font-semibold">Estado:</span> {order.shipping.status}</div>
          </div>
        </div>
      )}
    </div>
  );
}
