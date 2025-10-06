'use client';

import { useState, useEffect } from 'react';
import { getMyAddresses, saveAddress, deleteAddress } from '@/server/actions/addresses';
import { Toaster, toast } from 'sonner';
import { Address } from '@prisma/client';
import { venezuelaData } from '@/lib/venezuela-data';

// Modal Form Component
const AddressForm = ({ address, onClose, onSave }: { address: Partial<Address> | null, onClose: () => void, onSave: () => void }) => {
  const [state, setState] = useState(address?.state || '');

  const handleSubmit = async (formData: FormData) => {
    if (address?.id) {
      formData.append('id', address.id);
    }
    const result = await saveAddress(formData);
    if (result.success) {
      toast.success(result.message);
      onSave();
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{address?.id ? 'Editar' : 'Nueva'} Dirección</h2>
        <form action={handleSubmit}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <input type="hidden" name="id" defaultValue={address?.id || ''} />
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input type="text" name="fullname" id="fullname" defaultValue={address?.fullname || ''} required className="mt-1 input-class" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input type="tel" name="phone" id="phone" defaultValue={address?.phone || ''} required className="mt-1 input-class" />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
              <select name="state" id="state" value={state} onChange={e => setState(e.target.value)} required className="mt-1 input-class">
                <option value="">Seleccione un estado</option>
                {venezuelaData.map(s => <option key={s.estado} value={s.estado}>{s.estado}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ciudad / Municipio</label>
              <select name="city" id="city" required className="mt-1 input-class">
                <option value="">Seleccione una ciudad</option>
                {(venezuelaData.find(s => s.estado === state)?.ciudades || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="address1" className="block text-sm font-medium text-gray-700">Dirección</label>
              <textarea name="address1" id="address1" defaultValue={address?.address1 || ''} required className="mt-1 input-class"></textarea>
            </div>
             <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas / Punto de Referencia</label>
              <textarea name="notes" id="notes" defaultValue={address?.notes || ''} className="mt-1 input-class"></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function DireccionesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null);

  const fetchAddresses = async () => {
    const addrs = await getMyAddresses();
    setAddresses(addrs);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      const result = await deleteAddress(id);
      if (result.success) {
        toast.success(result.message);
        fetchAddresses();
      } else {
        toast.error(result.message);
      }
    }
  };

  return (
    <div>
      <Toaster richColors />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mis Direcciones</h1>
        <button onClick={handleAddNew} className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">Añadir Dirección</button>
      </div>

      <div className="space-y-4">
        {addresses.length > 0 ? (
          addresses.map(addr => (
            <div key={addr.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800">{addr.fullname}</p>
                <p className="text-sm text-gray-600">{addr.address1}</p>
                <p className="text-sm text-gray-600">{addr.city}, {addr.state}</p>
                <p className="text-sm text-gray-600">{addr.phone}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(addr)} className="text-sm text-blue-600 hover:underline">Editar</button>
                <button onClick={() => handleDelete(addr.id)} className="text-sm text-red-600 hover:underline">Eliminar</button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center bg-white p-8 rounded-lg shadow-sm">
            <p className="text-gray-600">No tienes direcciones guardadas.</p>
          </div>
        )}
      </div>

      {isModalOpen && <AddressForm address={editingAddress} onClose={() => setIsModalOpen(false)} onSave={fetchAddresses} />}
      <style jsx>{`
        .input-class {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #D1D5DB;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .input-class:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
