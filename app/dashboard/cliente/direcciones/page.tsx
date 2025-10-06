import { getMyAddresses } from '@/server/actions/addresses';
import DeleteAddressButton from '@/components/cliente/delete-address-button';
import AddressForm from '@/components/cliente/address-form';

export const dynamic = 'force-dynamic';

export default async function DireccionesClientePage() {
  const addresses = await getMyAddresses();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mis Direcciones</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Agregar nueva dirección</h2>
          <AddressForm />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Direcciones guardadas</h2>
          {addresses.length === 0 ? (
            <div className="text-sm text-gray-600">Aún no has agregado direcciones.</div>
          ) : (
            <div className="space-y-3">
              {addresses.map((a: any) => (
                <div key={a.id} className="border rounded p-3 flex items-start justify-between">
                  <div className="text-sm text-gray-800">
                    <div className="font-medium">{a.fullname} • {a.phone}</div>
                    <div>{a.address1}{a.address2 ? `, ${a.address2}` : ''}</div>
                    <div>{a.zone ? `${a.zone}, ` : ''}{a.city}, {a.state}</div>
                    {a.notes ? <div className="text-gray-600">Notas: {a.notes}</div> : null}
                  </div>
                  <DeleteAddressButton id={a.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
