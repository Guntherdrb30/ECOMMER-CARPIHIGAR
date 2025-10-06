
import Link from 'next/link';
import Price from '@/components/price';
import { getProducts } from '@/server/actions/products';
import { getSettings } from '@/server/actions/settings';
import { getCategories } from '@/server/actions/categories';
import ProductCard from '@/components/product-card';

export default async function ProductosPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = (await searchParams) || {};
  const categorySlug = typeof sp.categoria === 'string' ? sp.categoria : undefined;
  
  const products = await getProducts({ categorySlug });
  const settings = await getSettings();
  const categories = await getCategories();
  
  const selectedCategory = categorySlug ? categories.find(c => c.slug === categorySlug) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">{selectedCategory ? selectedCategory.name : 'Nuestros Productos'}</h1>
      {/* descripcion de categoria (opcional) */}

      {/* Filter Controls - Non-functional, for display */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-wrap items-center gap-4">
        <div className="flex-grow">
          <label htmlFor="search" className="sr-only">Búsqueda</label>
          <input type="text" id="search" placeholder="Buscar productos..." className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand" />
        </div>
        <div className="flex-shrink-0">
          <label htmlFor="category" className="sr-only">Categoría</label>
          <select id="category" defaultValue={categorySlug || ''} className="border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand">
            <option value="">Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} tasa={settings.tasaVES.toNumber()} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-700">No se encontraron productos</h2>
          <p className="mt-2 text-gray-500">No hay productos que coincidan con la categoría seleccionada.</p>
          <Link href="/productos" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Ver todos los productos
          </Link>
        </div>
      )}
    </div>
  );
}
