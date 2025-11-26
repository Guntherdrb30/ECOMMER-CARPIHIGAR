import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getConfigurableProducts, setProductEcpdConfig } from '@/server/actions/ecpd';
import { getProducts } from '@/server/actions/products';
import ShowToastFromSearch from '@/components/show-toast-from-search';

const defaultSchema = {
  name: 'Armario Nidus',
  dimensions: {
    width: { min: 130, max: 230 },
    depth: { min: 30, max: 110 },
    height: { min: 33, max: 65 },
  },
  components: {
    shelves: { min: 1, max: 7 },
    drawers: { min: 1, max: 3, spacePerDrawer: 20 },
    maletero: { min: 0, max: 50 },
    hangingBar: { type: 'boolean' },
    rodapieAMedida: {
      type: 'conditional',
      requires: 'rodapieAMedida',
      dimension: { min: 6, max: 20 },
    },
  },
  aesthetics: {
    doors: ['Una', 'Dos', 'Sin puertas'],
    colors: ['Blanco', 'Antracita', 'Roble', 'Blanco/roble'],
    handles: ['Tirador Japón', 'Tirador Alemania', 'Niquel', 'Negro'],
  },
  pricing: {
    referencePrice: 300,
    referenceVolume: 130 * 30 * 33,
    surcharges: {
      oneDoor: 14.99,
      twoDoors: 29.99,
      noRodapie: 2,
      rodapieAMedida: 7,
    },
  },
};

export default async function ConfigurableProductsPage() {
  const session = await getServerSession(authOptions as any);
  const role = String((session?.user as any)?.role || '');
  if (!session?.user || role !== 'ADMIN') {
    redirect('/auth/login?callbackUrl=/dashboard/admin/productos/configurables');
  }

  const [allProducts, configurable] = await Promise.all([
    getProducts(),
    getConfigurableProducts(),
  ]);

  const configurableIds = new Set(
    configurable.filter((p) => p.isConfigurable).map((p) => p.id),
  );

  async function setConfigurable(formData: FormData) {
    'use server';
    const productId = String(formData.get('productId') || '');
    const schemaText = String(formData.get('schema') || '').trim();
    if (!productId) {
      redirect('/dashboard/admin/productos/configurables?error=Producto%20requerido');
    }
    let schema: any = null;
    if (schemaText) {
      try {
        schema = JSON.parse(schemaText);
      } catch {
        redirect(
          '/dashboard/admin/productos/configurables?error=El%20JSON%20no%20es%20v%C3%A1lido',
        );
      }
    } else {
      schema = defaultSchema;
    }
    await setProductEcpdConfig(productId, {
      name: String(schema?.name || 'Configurador'),
      schema,
    });
    redirect(
      '/dashboard/admin/productos/configurables?message=Configurador%20actualizado',
    );
  }

  async function disableConfigurable(formData: FormData) {
    'use server';
    const productId = String(formData.get('productId') || '');
    if (!productId) {
      redirect('/dashboard/admin/productos/configurables');
    }
    await setProductEcpdConfig(productId, null);
    redirect(
      '/dashboard/admin/productos/configurables?message=Configurador%20desactivado',
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <h1 className="text-2xl font-bold mb-2">Muebles personalizables (ECPD)</h1>
      <p className="text-sm text-gray-600 mb-4">
        Desde aquí defines qué productos del catálogo se pueden personalizar con el motor ECPD y, de forma avanzada, puedes ajustar el esquema JSON del configurador.
      </p>

      <section className="bg-white rounded-lg shadow p-4 space-y-3">
        <h2 className="text-lg font-semibold">Seleccionar producto y definir esquema</h2>
        <form action={setConfigurable} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto base
              </label>
              <select
                name="productId"
                className="w-full border rounded px-2 py-1 text-sm"
                required
              >
                <option value="">Selecciona un producto…</option>
                {allProducts.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {configurableIds.has(p.id) ? ' (configurable)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Puedes reutilizar un producto existente como base de precio y ficha de catálogo.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Esquema JSON (opcional, avanzado)
              </label>
              <textarea
                name="schema"
                className="w-full border rounded px-2 py-1 text-xs min-h-[140px] font-mono"
                placeholder={JSON.stringify(defaultSchema, null, 2)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Si lo dejas vacío se usará el esquema por defecto del Armario Nidus. Puedes pegar aquí un JSON
                compatible con el ECPD para definir dimensiones, componentes y precios específicos.
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-brand text-white text-sm font-semibold hover:bg-opacity-90"
          >
            Guardar como configurable
          </button>
        </form>
      </section>

      <section className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Listado de muebles configurables</h2>
        {configurable.filter((p) => p.isConfigurable).length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no hay productos configurables. Marca al menos uno desde el formulario superior.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left font-semibold">Producto</th>
                <th className="p-2 text-left font-semibold">Slug</th>
                <th className="p-2 text-left font-semibold">Esquema</th>
                <th className="p-2 text-left font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {configurable
                .filter((p) => p.isConfigurable)
                .map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2 text-xs text-gray-600">{p.slug}</td>
                    <td className="p-2 text-xs text-gray-600 max-w-md">
                      <pre className="whitespace-pre-wrap break-words max-h-32 overflow-auto bg-gray-50 rounded p-2">
                        {JSON.stringify(p.configSchema ?? {}, null, 2)}
                      </pre>
                    </td>
                    <td className="p-2 text-right">
                      <form action={disableConfigurable}>
                        <input type="hidden" name="productId" value={p.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded border text-xs text-red-600 hover:bg-red-50"
                        >
                          Desactivar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

