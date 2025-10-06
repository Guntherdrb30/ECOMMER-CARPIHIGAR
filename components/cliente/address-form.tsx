'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveAddressSA } from '@/server/actions/addresses';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">
      {pending ? 'Guardando…' : 'Guardar'}
    </button>
  );
}

export default function AddressForm() {
  const router = useRouter();
  const initial = { success: false, message: '' } as any;
  const [state, action] = useActionState(saveAddressSA as any, initial);

  useEffect(() => {
    if (state && typeof state === 'object') {
      if ((state as any).success) {
        toast.success((state as any).message || 'Dirección guardada');
        try {
          const form = document.getElementById('address-form') as HTMLFormElement | null;
          form?.reset();
        } catch {}
        router.refresh();
      } else if ((state as any).message) {
        toast.error((state as any).message);
      }
    }
  }, [state, router]);

  return (
    <form id="address-form" action={action} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700" htmlFor="fullname">Nombre completo</label>
          <input id="fullname" name="fullname" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700" htmlFor="phone">Teléfono</label>
          <input id="phone" name="phone" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700" htmlFor="state">Estado</label>
          <input id="state" name="state" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700" htmlFor="city">Ciudad</label>
          <input id="city" name="city" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700" htmlFor="zone">Zona (opcional)</label>
          <input id="zone" name="zone" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700" htmlFor="address1">Dirección</label>
          <input id="address1" name="address1" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700" htmlFor="address2">Referencia (opcional)</label>
          <input id="address2" name="address2" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700" htmlFor="notes">Notas (opcional)</label>
          <textarea id="notes" name="notes" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 min-h-[80px]" />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
