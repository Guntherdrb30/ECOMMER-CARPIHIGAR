import { getAllShippedOrders } from "@/server/actions/orders";
import Link from "next/link";
import { Search } from "lucide-react";

export default async function AdminEnviosPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const searchQuery = searchParams?.q?.toString() || "";
  const orders = await getAllShippedOrders(searchQuery);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Envíos</h1>
      </div>
      <div className="mb-6">
        <form>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Buscar por cliente, tracking, o ciudad..."
              className="border border-gray-300 rounded-lg px-10 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pedido</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transportista</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tracking</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ciudad</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado del Envío</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link href={`/dashboard/admin/pedidos/${order.id}`} className="text-blue-600 hover:text-blue-800 font-semibold">
                        #{order.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.shipping?.carrier}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{order.shipping?.tracking}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.shippingAddress?.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const status = order.shipping?.status || 'PENDIENTE';
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
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <Link href={`/dashboard/admin/pedidos/${order.id}`} className="text-blue-600 hover:text-blue-900">Detalles</Link>
                        <a className="text-gray-700 hover:text-gray-900" href={`/api/shipments/${order.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
                        {order.user?.phone ? (
                          <a
                            className="text-green-600 hover:text-green-800"
                            href={`https://wa.me/${order.user.phone.replace(/[^0-9]/g,'') || ''}?text=${encodeURIComponent(`Hola ${order.user.name || ''}, te compartimos los datos de tu envío #${order.id.slice(0,8)}. Transportista: ${order.shipping?.carrier || '-'}; Tracking: ${order.shipping?.tracking || '-'}.
PDF: ${(process.env.NEXT_PUBLIC_URL || '') + '/api/shipments/' + order.id + '/pdf'}`)}`}
                            target="_blank" rel="noreferrer"
                          >WhatsApp</a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500">
                    <p className="text-lg">No se encontraron envíos.</p>
                    {searchQuery && <p className="text-sm mt-2">Intenta con otra búsqueda.</p>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
