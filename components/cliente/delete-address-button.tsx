'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteAddressSA } from '@/server/actions/addresses';

export default function DeleteAddressButton({ id }: { id: string }) {
  const router = useRouter();
  const initial = { success: false, message: '' } as any;
  const [state, action] = useActionState(deleteAddressSA as any, initial);

  useEffect(() => {
    if (state && typeof state === 'object') {
      if ((state as any).success) {
        toast.success((state as any).message || 'Dirección eliminada');
        router.refresh();
      } else if ((state as any).message) {
        toast.error((state as any).message);
      }
    }
  }, [state, router]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('¿Seguro que quieres eliminar esta dirección?')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-red-600 text-sm hover:underline">Eliminar</button>
    </form>
  );
}

