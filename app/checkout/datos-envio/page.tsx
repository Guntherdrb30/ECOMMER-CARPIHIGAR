'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveAddressFromCheckout } from '@/server/actions/addresses';
import { venezuelaData } from '@/lib/venezuela-data';

export default function DatosEnvioPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/checkout/revisar';
  const [selectedState, setSelectedState] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setSelectedState(newState);
    const stateData = venezuelaData.find(s => s.estado === newState);
    setCities(stateData ? stateData.ciudades : []);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Datos de Envío</h1>
      <form action={saveAddressFromCheckout} className="space-y-4 max-w-xl">
        <input type="hidden" name="next" value={next} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="fullname" className="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input id="fullname" name="fullname" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Tel�fono</label>
            <input id="phone" name="phone" required inputMode="tel" pattern="[0-9+()\s-]{10,}" title="Ej: +58 412 1234567 o 0412-1234567" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              id="state"
              name="state"
              required
              value={selectedState}
              onChange={handleStateChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="" disabled>Selecciona un estado</option>
              {venezuelaData.map(s => (
                <option key={s.estado} value={s.estado}>{s.estado}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ciudad</label>
            <select
              id="city"
              name="city"
              required
              disabled={!selectedState}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="" disabled>Selecciona una ciudad</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="zone" className="block text-sm font-medium text-gray-700">Zona (opcional)</label>
            <input id="zone" name="zone" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address1" className="block text-sm font-medium text-gray-700">Dirección</label>
            <input id="address1" name="address1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address2" className="block text-sm font-medium text-gray-700">Referencia (opcional)</label>
            <input id="address2" name="address2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas (opcional)</label>
            <textarea id="notes" name="notes" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm min-h-[80px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-blue-600 text-white px-3 py-2 rounded">Guardar y volver</button>
          <a href={next} className="px-3 py-2 rounded border">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
