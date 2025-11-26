import ConfiguratorUI from './components/ConfiguratorUI';
import { ProductSchema } from './lib/ProductSchema';
import { getSettings } from '@/server/actions/settings';

export const metadata = {
  title: 'Personalizar muebles | Carpihogar',
};

export default async function PersonalizarMueblesPage() {
  const settings = await getSettings();
  const tasa = Number((settings as any).tasaVES ?? 1);

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4 space-y-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.25em] text-brand uppercase mb-2">
            ECPD · Motor de Configuración
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            Personalizar muebles Carpihogar
          </h1>
          <p className="text-gray-600">
            Diseña tu armario a medida ajustando medidas, componentes internos y acabados. El precio se recalcula en tiempo real según tu configuración.
          </p>
        </header>
        <ConfiguratorUI schema={ProductSchema} tasa={tasa} />
      </div>
    </div>
  );
}

