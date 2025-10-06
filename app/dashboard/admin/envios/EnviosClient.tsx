'use client';

import { useState, useTransition, useMemo } from 'react';
import { saveShippingDetails } from '@/server/actions/shipping';
import type { Order, User, Shipping } from '@prisma/client';
import { ShippingStatus, ShippingCarrier, ShippingChannel } from '@prisma/client';

// Tipo enriquecido para las órdenes que se pasarán al componente
type OrderWithDetails = Order & {
  user: { name: string | null; email: string | null; };
  shipping: Shipping | null;
};

export function EnviosClient({ orders: initialOrders }: { orders: OrderWithDetails[] }) {
  const [statusFilter, setStatusFilter] = useState<ShippingStatus | 'TODOS'>('TODOS');
  const [channelFilter, setChannelFilter] = useState<ShippingChannel | 'TODOS'>('TODOS');
  const [qOrder, setQOrder] = useState('');
  const [qCliente, setQCliente] = useState('');
  const [qRif, setQRif] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSave = async (formData: FormData) => {
    const payload = {
      orderId: formData.get('orderId') as string,
      carrier: formData.get('carrier') as ShippingCarrier,
      tracking: formData.get('tracking') as string,
      status: formData.get('status') as ShippingStatus,
      observations: formData.get('observations') as string,
    };

    startTransition(async () => {
      await saveShippingDetails(payload);
      // Aquí podrías agregar una notificación (toast) para el usuario
    });
  };

  const filteredOrders = useMemo(() => initialOrders.filter(order => {
    // Estado/envío
    if (statusFilter !== 'TODOS') {
      const currentStatus = order.shipping?.status ?? 'PENDIENTE';
      if (currentStatus !== statusFilter) return false;
    }
    if (channelFilter !== 'TODOS') {
      if (order.shipping?.channel !== channelFilter) return false;
    }
    // Búsquedas por texto
    const matchesOrder = qOrder ? order.id.toLowerCase().includes(qOrder.toLowerCase()) : true;
    const cliente = `${order.user?.name || ''} ${order.user?.email || ''}`.trim();
    const matchesCliente = qCliente ? cliente.toLowerCase().includes(qCliente.toLowerCase()) : true;
    const rif = String((order as any).customerTaxId || '');
    const matchesRif = qRif ? rif.toLowerCase().includes(qRif.toLowerCase()) : true;
    return matchesOrder && matchesCliente && matchesRif;
  }), [initialOrders, statusFilter, channelFilter, qOrder, qCliente, qRif]);

  const statusOptions: (ShippingStatus | 'TODOS')[] = ['TODOS', ...Object.values(ShippingStatus)];

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'TODOS') params.set('status', String(statusFilter));
    if (channelFilter !== 'TODOS') params.set('channel', String(channelFilter));
    return `/api/reports/shipments?${params.toString()}`;
  }, [statusFilter, channelFilter]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ShippingStatus | 'TODOS')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="channel-filter" className="block text-sm font-medium text-gray-700 mb-2">Filtrar por canal</label>
          <select
            id="channel-filter"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as ShippingChannel | 'TODOS')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {(['TODOS','ONLINE','TIENDA'] as const).map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Orden/Factura</label>
          <input value={qOrder} onChange={(e) => setQOrder(e.target.value)} placeholder="ID orden/factura" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
          <input value={qCliente} onChange={(e) => setQCliente(e.target.value)} placeholder="Nombre o email" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cédula/RIF</label>
          <input value={qRif} onChange={(e) => setQRif(e.target.value)} placeholder="V- / J-" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-2 py-1" />
        </div>
        <div className="flex justify-end">
          <a className="px-3 py-2 border rounded" target="_blank" href={exportHref}>Exportar CSV</a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Orden</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carrier</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <form action={handleSave}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.user.name || 'N/A'} {order.shipping?.channel ? `· ${order.shipping.channel}` : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select name="carrier" defaultValue={order.shipping?.carrier || 'TEALCA'} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      {Object.values(ShippingCarrier).map(carrier => (
                        <option key={carrier} value={carrier}>{carrier}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input type="text" name="tracking" defaultValue={order.shipping?.tracking || ''} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     <select name="status" defaultValue={order.shipping?.status || 'PENDIENTE'} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      {Object.values(ShippingStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <textarea name="observations" defaultValue={order.shipping?.observations || ''} rows={2} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button type="submit" disabled={isPending} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                      {isPending ? 'Guardando...' : 'Guardar'}
                    </button>
                    <a
                      className="inline-flex justify-center py-2 px-3 border rounded text-sm"
                      target="_blank"
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Orden ${order.id}\nCliente: ${order.user.name || 'N/A'}\nCanal: ${order.shipping?.channel || '-'}\nCarrier: ${order.shipping?.carrier || '-'}\nTracking: ${order.shipping?.tracking || '-'}\nEstado: ${order.shipping?.status || 'PENDIENTE'}\nObs: ${order.shipping?.observations || ''}`,
                      )}`}
                    >
                      WhatsApp
                    </a>
                  </td>
                </form>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
