import Link from 'next/link';
import { getConfigurableProducts } from '@/server/actions/ecpd';

export const metadata = {
  title: 'Personalizar muebles | Carpihogar',
};

export default async function PersonalizarMueblesIndexPage() {
  const products = await getConfigurableProducts();

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4 space-y-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.25em] text-brand uppercase mb-2">
            ECPD · Motor de Configuración
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            Elige el mueble que quieres personalizar
          </h1>
          <p className="text-gray-600">
            Primero elige el modelo (armario, zapatero, etc.) y luego ajusta medidas, colores y
            componentes en el configurador.
          </p>
        </header>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            Aún no hay muebles configurables dados de alta. Cuando crees productos configurables en
            el panel de administrador, aparecerán listados aquí.
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const img = (p.images || [])[0];
              return (
                <Link
                  key={p.id}
                  href={`/personalizar-muebles/${p.slug}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <h2 className="font-semibold text-sm md:text-base text-gray-900 group-hover:text-brand">
                      {p.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Haz clic para ajustar medidas y acabados.
                    </p>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

