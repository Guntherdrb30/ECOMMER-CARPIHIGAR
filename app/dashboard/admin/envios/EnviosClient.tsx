'use client';

import { useState, useTransition, useMemo } from 'react';
import { saveShippingDetails } from '@/server/actions/shipping';
import type { Order, User, Shipping } from '@prisma/client';
import { ShippingStatus, ShippingCarrier, ShippingChannel } from '@prisma/client';
import { toast } from 'sonner';

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
  const [selectedStatusByOrder, setSelectedStatusByOrder] = useState<Record<string, ShippingStatus>>({});
  const [observationsByOrder, setObservationsByOrder] = useState<Record<string, string>>({});
  const [selectedCarrierByOrder, setSelectedCarrierByOrder] = useState<Record<string, ShippingCarrier>>({});
  const [trackingByOrder, setTrackingByOrder] = useState<Record<string, string>>({});

  const handleSave = async (formData: FormData) => {
    const payload = {
      orderId: formData.get('orderId') as string,
      carrier: formData.get('carrier') as ShippingCarrier,
      tracking: formData.get('tracking') as string,
      status: formData.get('status') as ShippingStatus,
      observations: formData.get('observations') as string,
    };

    startTransition(async () => {
      try {
        const res = await saveShippingDetails(payload);
        if (res?.success) {
          toast.success('Envío guardado', {
            description: (
              <div className="mt-1 text-sm">
                Orden {payload.orderId.substring(0,8)}… actualizada ·
                <a
                  className="ml-2 underline text-blue-700"
                  href={`/api/shipments/${payload.orderId}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver PDF
                </a>
                <a
                  className="ml-3 underline text-blue-700"
                  href={`/dashboard/admin/pedidos/${payload.orderId}`}
                >
                  Abrir pedido
                </a>
              </div>
            ),
            action: {
              label: 'Abrir pedido',
              onClick: () => window.open(`/dashboard/admin/pedidos/${payload.orderId}`, '_blank'),
            },
          });
          // Limpia los estados locales de la fila para reflejar backend tras recarga
          setSelectedStatusByOrder((prev) => {
            const copy = { ...prev };
            delete copy[payload.orderId];
            return copy;
          });
          setSelectedCarrierByOrder((prev) => {
            const copy = { ...prev };
            delete copy[payload.orderId];
            return copy;
          });
          setTrackingByOrder((prev) => {
            const copy = { ...prev };
            delete copy[payload.orderId];
            return copy;
          });
          setObservationsByOrder((prev) => {
            const copy = { ...prev };
            delete copy[payload.orderId];
            return copy;
          });
        } else {
          toast.error('No se pudo guardar el envío');
        }
      } catch (e) {
        toast.error('Error al guardar el envío');
      }
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
                    <select
                      name="carrier"
                      value={(selectedCarrierByOrder[order.id] || (order.shipping?.carrier as ShippingCarrier) || 'TEALCA') as ShippingCarrier}
                      onChange={(e) =>
                        setSelectedCarrierByOrder((prev) => ({
                          ...prev,
                          [order.id]: e.target.value as ShippingCarrier,
                        }))
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      {Object.values(ShippingCarrier).map(carrier => (
                        <option key={carrier} value={carrier}>{carrier}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="text"
                      name="tracking"
                      value={trackingByOrder[order.id] ?? (order.shipping?.tracking || '')}
                      onChange={(e) =>
                        setTrackingByOrder((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      const status = (selectedStatusByOrder[order.id] || (order.shipping?.status as ShippingStatus) || 'PENDIENTE') as ShippingStatus;
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
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{status}</span>
                          <select
                            name="status"
                            value={status}
                            onChange={(e) =>
                              setSelectedStatusByOrder((prev) => ({
                                ...prev,
                                [order.id]: e.target.value as ShippingStatus,
                              }))
                            }
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            {Object.values(ShippingStatus).map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <textarea
                      name="observations"
                      rows={2}
                      value={observationsByOrder[order.id] ?? (order.shipping?.observations || '')}
                      onChange={(e) =>
                        setObservationsByOrder((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    ></textarea>
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
