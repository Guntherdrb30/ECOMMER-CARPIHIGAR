import { getSuppliers, createSupplier, updateSupplier } from "@/server/actions/procurement";
import { PendingButton } from '@/components/pending-button';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import MainImageUploader from '@/components/admin/main-image-uploader';

export default async function SuppliersPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const [suppliers, sp] = await Promise.all([
    getSuppliers(),
    (async () => (await searchParams) || {})(),
  ]);
  const error = (sp as any).error;
  const message = (sp as any).message;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <h1 className="text-2xl font-bold">Proveedores</h1>
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">
          {error}
        </div>
      )}
      {message && (
        <div className="border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">
          {message}
        </div>
      )}

      {/* Crear proveedor */}
      <div className="form-card">
        <h2 className="text-lg font-bold">Crear proveedor</h2>
        <form action={createSupplier} className="form-grid">
          <div>
            <label className="form-label" htmlFor="name">
              Nombre del proveedor
            </label>
            <input
              id="name"
              name="name"
              placeholder="Carpintería Ejemplo C.A."
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="taxId">
              RIF / NIT
            </label>
            <input
              id="taxId"
              name="taxId"
              placeholder="J-00000000-0"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="email">
              Email (opcional)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="facturacion@proveedor.com"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="phone">
              Teléfono empresa (opcional)
            </label>
            <input
              id="phone"
              name="phone"
              placeholder="+58 000-0000000"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="contactName">
              Persona contacto
            </label>
            <input
              id="contactName"
              name="contactName"
              placeholder="Nombre y apellido"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="contactPhone">
              Teléfono contacto
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              placeholder="+58 000-0000000"
              className="form-input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="form-label" htmlFor="address">
              Dirección según RIF (opcional)
            </label>
            <input
              id="address"
              name="address"
              placeholder="Dirección completa tal como aparece en el RIF"
              className="form-input"
            />
          </div>

          <div>
            <span className="form-label">Imagen del RIF (opcional)</span>
            <MainImageUploader targetName="rifImageUrl" />
          </div>

          <div>
            <span className="form-label">Crédito</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="givesCredit"
                name="givesCredit"
                type="checkbox"
                className="h-4 w-4"
              />
              <label htmlFor="givesCredit" className="text-sm text-gray-700">
                Otorga crédito
              </label>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor="creditDays" className="text-sm text-gray-700">
                Días de crédito
              </label>
              <input
                id="creditDays"
                name="creditDays"
                type="number"
                min={0}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <PendingButton
              className="bg-green-600 text-white px-3 py-1 rounded"
              pendingText="Guardando…"
            >
              Guardar
            </PendingButton>
          </div>
        </form>
      </div>

      {/* Listado */}
      <div className="form-card">
        <h2 className="text-lg font-bold mb-2">Listado</h2>
        <details className="rounded border border-gray-200" open>
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-700">
            Ver proveedores
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2">RIF/NIT</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Teléfono empresa</th>
                  <th className="px-3 py-2">Contacto</th>
                  <th className="px-3 py-2">Crédito</th>
                  <th className="px-3 py-2">Dirección</th>
                  <th className="px-3 py-2">RIF (imagen)</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s: any) => (
                  <tr key={s.id}>
                    <td className="border px-3 py-2">{s.name}</td>
                    <td className="border px-3 py-2 text-center">{s.taxId || '—'}</td>
                    <td className="border px-3 py-2 text-center">{s.email || '—'}</td>
                    <td className="border px-3 py-2 text-center">{s.phone || '—'}</td>
                    <td className="border px-3 py-2 text-center">
                      {s.contactName ? (
                        <div className="space-y-0.5">
                          <div>{s.contactName}</div>
                          <div className="text-xs text-gray-500">
                            {s.contactPhone || ''}
                          </div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      {s.givesCredit ? `Sí, ${s.creditDays ?? 0} días` : 'No'}
                    </td>
                    <td className="border px-3 py-2">{s.address || '—'}</td>
                    <td className="border px-3 py-2 text-center">
                      {s.rifImageUrl ? (
                        <a
                          href={s.rifImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Ver RIF
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* Editar proveedores */}
      <div className="form-card">
        <details className="rounded border border-gray-200" open>
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-700">
            Editar proveedores
          </summary>
          <p className="text-sm text-gray-600 mb-2">
            Edita cualquier campo y guarda para aplicar cambios.
          </p>
          <div className="space-y-3">
            {suppliers.map((s: any) => (
              <form
                key={s.id}
                action={updateSupplier}
                className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end"
              >
                <input type="hidden" name="id" value={s.id} />
                <input
                  name="name"
                  defaultValue={s.name}
                  placeholder="Nombre"
                  className="form-input"
                />
                <input
                  name="taxId"
                  defaultValue={s.taxId || ''}
                  placeholder="RIF/NIT"
                  className="form-input"
                />
                <input
                  name="email"
                  defaultValue={s.email || ''}
                  placeholder="Email"
                  className="form-input"
                />
                <input
                  name="phone"
                  defaultValue={s.phone || ''}
                  placeholder="Teléfono empresa"
                  className="form-input"
                />
                <input
                  name="contactName"
                  defaultValue={s.contactName || ''}
                  placeholder="Persona contacto"
                  className="form-input"
                />
                <input
                  name="contactPhone"
                  defaultValue={s.contactPhone || ''}
                  placeholder="Teléfono contacto"
                  className="form-input"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      id={`givesCredit-${s.id}`}
                      name="givesCredit"
                      type="checkbox"
                      defaultChecked={Boolean(s.givesCredit)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`givesCredit-${s.id}`}
                      className="text-xs text-gray-700"
                    >
                      Otorga crédito
                    </label>
                  </div>
                  <input
                    name="creditDays"
                    type="number"
                    min={0}
                    defaultValue={s.creditDays ?? ''}
                    placeholder="Días"
                    className="form-input"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <input
                    name="address"
                    defaultValue={s.address || ''}
                    placeholder="Dirección según RIF"
                    className="form-input mb-1"
                  />
                  <div className="flex items-center gap-3 mb-1">
                    {s.rifImageUrl && (
                      <a
                        href={s.rifImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver RIF actual
                      </a>
                    )}
                    <span className="text-xs text-gray-500">
                      Subir nuevo RIF (opcional)
                    </span>
                  </div>
                  <MainImageUploader targetName="rifImageUrl" />
                </div>
                <PendingButton
                  className="bg-gray-800 text-white px-3 py-1 rounded"
                  pendingText="Guardando..."
                >
                  Guardar
                </PendingButton>
              </form>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

