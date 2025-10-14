import { getSuppliers, createSupplier, updateSupplier } from "@/server/actions/procurement";
import { PendingButton } from '@/components/pending-button';
import ShowToastFromSearch from '@/components/show-toast-from-search';

export default async function SuppliersPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const [suppliers, sp] = await Promise.all([ getSuppliers(), (async () => (await searchParams) || {})() ]);
  const error = (sp as any).error;
  const message = (sp as any).message;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <h1 className="text-2xl font-bold">Proveedores</h1>
      {error && <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">{error}</div>}
      {message && <div className="border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">{message}</div>}

      <div className="form-card">
        <h2 className="text-lg font-bold">Crear proveedor</h2>
        <form action={createSupplier} className="form-grid">
          <input name="name" placeholder="Nombre" className="form-input" required />
          <input name="email" type="email" placeholder="Email (opcional)" className="form-input" />
          <input name="phone" placeholder="Teléfono (opcional)" className="form-input" />
          <input name="taxId" placeholder="RIF/NIT (opcional)" className="form-input" />
          <input name="address" placeholder="Dirección (opcional)" className="form-input md:col-span-2" />
          <PendingButton className="bg-green-600 text-white px-3 py-1 rounded" pendingText="Guardando…">Guardar</PendingButton>
        </form>
      </div>

      <div className="form-card">
        <h2 className="text-lg font-bold mb-2">Listado</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">RIF/NIT</th>
                <th className="px-3 py-2">Dirección</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s: any) => (
                <tr key={s.id}>
                  <td className="border px-3 py-2">{s.name}</td>
                  <td className="border px-3 py-2 text-center">{s.email || '—'}</td>
                  <td className="border px-3 py-2 text-center">{s.phone || '—'}</td>
                  <td className="border px-3 py-2 text-center">{s.taxId || '—'}</td>
                  <td className="border px-3 py-2">{s.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-card">
        <h2 className="text-lg font-bold mb-2">Editar proveedores</h2>
        <p className="text-sm text-gray-600 mb-2">Edita cualquier campo y guarda para aplicar cambios.</p>
        <div className="space-y-3">
          {suppliers.map((s: any) => (
            <form key={s.id} action={updateSupplier} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
              <input type="hidden" name="id" value={s.id} />
              <input name="name" defaultValue={s.name} placeholder="Nombre" className="form-input" />
              <input name="email" defaultValue={s.email || ''} placeholder="Email" className="form-input" />
              <input name="phone" defaultValue={s.phone || ''} placeholder="Teléfono" className="form-input" />
              <input name="taxId" defaultValue={s.taxId || ''} placeholder="RIF/NIT" className="form-input" />
              <input name="address" defaultValue={s.address || ''} placeholder="Dirección" className="form-input md:col-span-2" />
              <PendingButton className="bg-gray-800 text-white px-3 py-1 rounded" pendingText="Guardando...">Guardar</PendingButton>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
