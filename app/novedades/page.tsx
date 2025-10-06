import { getProducts } from '@/server/actions/products';
import { getSettings } from '@/server/actions/settings';
import ProductCard from '@/components/product-card';

export default async function NovedadesPage() {
  const products = await getProducts({ isNew: true });
  const settings = await getSettings();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Novedades</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Descubre los ultimos productos que hemos agregado a nuestro catalogo.
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} tasa={settings.tasaVES.toNumber()} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-700">No hay novedades por ahora</h2>
          <p className="mt-2 text-gray-500">Vuelve a visitarnos pronto para ver los nuevos ingresos.</p>
        </div>
      )}
    </div>
  );
}
