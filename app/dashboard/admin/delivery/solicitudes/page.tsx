import { getServerSession } from 'next-auth';
import ImageLightbox from '@/components/admin/image-lightbox';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPendingDeliveries, approveDeliveryByForm, rejectDeliveryByForm } from '@/server/actions/users';

export default async function DeliveryRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') redirect('/auth/login');
  const pending = await getPendingDeliveries();

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Solicitudes de Delivery</h1>
      {pending.length === 0 ? (
        <div className="text-gray-600">No hay solicitudes pendientes.</div>
      ) : (
        <div className="bg-white rounded shadow divide-y">
          {pending.map((u: any) => (
            <div key={u.id} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <div className="space-y-1">
                <div className="font-semibold">{u.name || u.email}</div>
                <div className="text-sm text-gray-700">Email: {u.email}</div>
                <div className="text-sm text-gray-700">Tel: {u.phone || '-'}</div>
                <div className="text-sm text-gray-700">Cédula: {u.deliveryCedula || '-'}</div>
                <div className="text-sm text-gray-700">Dirección: {u.deliveryAddress || '-'}</div>
                <div className="text-sm text-gray-700">Placa moto: {u.deliveryMotoPlate || '-'}</div>
                <div className="text-sm text-gray-700">Serial carrocería: {u.deliveryChassisSerial || '-'}</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Foto Cédula</div>
                  {u.deliveryIdImageUrl ? (
                    <ImageLightbox src={u.deliveryIdImageUrl} alt="Foto cédula" />
                  ) : (
                    <div className="text-gray-500 text-sm">No cargada</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Selfie</div>
                  {u.deliverySelfieUrl ? (
                    <ImageLightbox src={u.deliverySelfieUrl} alt="Selfie de registro" />
                  ) : (
                    <div className="text-gray-500 text-sm">No cargada</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <form action={approveDeliveryByForm}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button className="px-3 py-2 rounded bg-green-600 text-white">Aprobar</button>
                </form>
                <form action={rejectDeliveryByForm}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button className="px-3 py-2 rounded border border-red-600 text-red-700">Rechazar</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}








