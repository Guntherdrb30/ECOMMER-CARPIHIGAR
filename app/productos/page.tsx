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
import CategoryCombobox from '@/components/category-combobox';
import ProductLiveSearch from '@/components/product-live-search';

export default async function ProductosPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = (await searchParams) || {};
  const categorySlug = typeof sp.categoria === 'string' ? sp.categoria : undefined;
  const q = typeof sp.q === 'string' ? sp.q : '';
  
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const [products, settings, categories, wishlistItems] = await Promise.all([
    getProducts({ categorySlug, q: q || undefined }),
    getSettings(),
    getCategoriesFlattened(),
    userId ? prisma.wishlistItem.findMany({ where: { userId } }) : Promise.resolve([]),
  ]);

  const wishlistedProductIds = new Set(wishlistItems.map(item => item.productId));
  
  const selectedCategory = categorySlug ? (categories as any[]).find((c: any) => c.slug === categorySlug) : null;
  const topLevel = (categories as any[]).filter((c: any) => (c.depth || 0) === 0);
  const childrenOfSelected = selectedCategory ? (categories as any[]).filter((c: any) => c.parentId === selectedCategory.id) : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">{selectedCategory ? selectedCategory.name : 'Nuestros Productos'}</h1>
      {/* descripcion de categoria (opcional) */}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-wrap items-center gap-4">
        <div className="flex-grow min-w-[280px]">
          {/* Buscador en vivo con sugerencias */}
          <ProductLiveSearch placeholder="Buscar productos..." defaultQuery={q} />
        </div>
        <div className="flex-shrink-0 min-w-[240px]">
          <label htmlFor="category" className="sr-only">Categoría</label>
          <CategoryCombobox categories={categories as any} value={categorySlug || ''} />
        </div>
      </div>

      {/* Chips de navegación por categorías */}
      <div className="mb-6">
        {selectedCategory ? (
          childrenOfSelected.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Link href={`/productos?categoria=${selectedCategory.slug}`} className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm">{selectedCategory.name}</Link>
              {childrenOfSelected.map((c: any) => (
                <Link key={c.id} href={`/productos?categoria=${c.slug}`} className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 text-sm transition-colors">{c.name}</Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topLevel.map((c: any) => (
                <Link key={c.id} href={`/productos?categoria=${c.slug}`} className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm transition-colors ${c.slug===selectedCategory?.slug ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border-gray-200'}`}>{c.name}</Link>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {topLevel.map((c: any) => (
              <Link key={c.id} href={`/productos?categoria=${c.slug}`} className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 text-sm transition-colors">{c.name}</Link>
            ))}
          </div>
        )}
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


