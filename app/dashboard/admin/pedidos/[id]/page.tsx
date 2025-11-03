import { getOrderById } from '@/server/actions/sales';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPedidoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') redirect('/auth/login?message=You Are Not Authorized!');

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow">Pedido no encontrado</div>
      </div>
    );
  }

  const ivaPercent = Number((order as any).ivaPercent || 16);
  const subtotalUSD = Number((order as any).subtotalUSD || 0);
  const ivaUSD = (subtotalUSD * ivaPercent) / 100;
  const totalUSD = Number((order as any).totalUSD || (subtotalUSD + ivaUSD));
  const tasaVES = Number((order as any).tasaVES || 40);
  const totalVES = Number((order as any).totalVES || totalUSD * tasaVES);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedido {String(order.id).slice(-6)}</h1>
        <a href="/dashboard/admin/envios" className="text-sm border px-3 py-1 rounded">Volver a Envíos</a>
      </div>

      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div className="text-gray-600 text-sm">Fecha</div>
          <div>{new Date(order.createdAt as any).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-600 text-sm">Estatus</div>
          <div className="font-semibold">{order.status}</div>
        </div>
        <div>
          <div className="text-gray-600 text-sm">Cliente</div>
          <div className="text-sm">{(order as any).user?.name || (order as any).user?.email || '-'}</div>
        </div>
        <div>
          <div className="text-gray-600 text-sm">Totales</div>
          <div>USD: ${totalUSD.toFixed(2)} · Bs: {totalVES.toFixed(2)}</div>
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
            {(order.items as any[]).map((it) => {
              const price = Number((it as any).priceUSD);
              const qty = Number((it as any).quantity);
              const sub = price * qty;
              return (
                <tr key={(it as any).id}>
                  <td className="border px-3 py-2">{(it as any).name || (it as any).product?.name || 'Producto'}</td>
                  <td className="border px-3 py-2 text-right">{price.toFixed(2)}</td>
                  <td className="border px-3 py-2 text-right">{qty}</td>
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
            <div>Método: {(order.payment as any).method}</div>
            <div>Moneda: {(order.payment as any).currency}</div>
            {(order.payment as any).reference && <div>Referencia: {(order.payment as any).reference}</div>}
          </div>
        ) : (
          <div className="text-sm text-gray-600">Sin registro de pago</div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <a className="border px-3 py-1 rounded" href={`/api/orders/${order.id}/pdf?tipo=recibo&moneda=USD`} target="_blank">Imprimir / PDF</a>
        </div>
      </div>

      {order.shipping && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-2">Envío</h2>
          <div className="text-sm space-y-1">
            {order.shippingAddress && (
              <div>
                <h3 className="font-semibold">Dirección de envío:</h3>
                <p>{(order.shippingAddress as any).fullname}</p>
                <p>{(order.shippingAddress as any).address1}, {(order.shippingAddress as any).city}, {(order.shippingAddress as any).state}</p>
                <p>{(order.shippingAddress as any).phone}</p>
              </div>
            )}
            <div><span className="font-semibold">Transportista:</span> {(order.shipping as any).carrier}</div>
            {(order.shipping as any).tracking && <div><span className="font-semibold">Tracking:</span> {(order.shipping as any).tracking}</div>}
            <div>
              <span className="font-semibold">Estado:</span>{' '}
              {(() => {
                const status = String((order.shipping as any).status || 'PENDIENTE');
                let badgeClass = 'bg-gray-100 text-gray-800';
                switch (status) {
                  case 'PENDIENTE':
                    badgeClass = 'bg-red-100 text-red-800';
                    break;
                  case 'ENTREGADO':
                    badgeClass = 'bg-green-100 text-green-800';
                    break;
                  case 'PREPARANDO':
                    badgeClass = 'bg-yellow-100 text-yellow-800';
                    break;
                  case 'DESPACHADO':
                    badgeClass = 'bg-blue-100 text-blue-800';
                    break;
                  case 'EN_TRANSITO':
                    badgeClass = 'bg-indigo-100 text-indigo-800';
                    break;
                  case 'INCIDENCIA':
                    badgeClass = 'bg-orange-100 text-orange-800';
                    break;
                }
                return (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{status}</span>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

