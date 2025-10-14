import Link from 'next/link';
import Price from '@/components/price';
import { getProducts } from '@/server/actions/products';
import { getSettings } from '@/server/actions/settings';
import { getCategoriesFlattened } from '@/server/actions/categories';
import ProductCard from '@/components/product-card';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import CategorySelect from '@/components/category-select';

export default async function ProductosPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = (await searchParams) || {};
  const categorySlug = typeof sp.categoria === 'string' ? sp.categoria : undefined;
  
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const [products, settings, categories, wishlistItems] = await Promise.all([
    getProducts({ categorySlug }),
    getSettings(),
    getCategoriesFlattened(),
    userId ? prisma.wishlistItem.findMany({ where: { userId } }) : Promise.resolve([]),
  ]);

  const wishlistedProductIds = new Set(wishlistItems.map(item => item.productId));
  
  const selectedCategory = categorySlug ? (categories as any[]).find((c: any) => c.slug === categorySlug) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">{selectedCategory ? selectedCategory.name : 'Nuestros Productos'}</h1>
      {/* descripcion de categoria (opcional) */}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-wrap items-center gap-4">
        <div className="flex-grow">
          <label htmlFor="search" className="sr-only">Búsqueda</label>
          <input type="text" id="search" placeholder="Buscar productos..." className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand" />
        </div>
        <div className="flex-shrink-0">
          <label htmlFor="category" className="sr-only">Categoría</label>
          <CategorySelect categories={categories as any} value={categorySlug || ''} />
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              tasa={(settings as any).tasaVES} 
              isWishlisted={wishlistedProductIds.has(product.id)}
            />
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

