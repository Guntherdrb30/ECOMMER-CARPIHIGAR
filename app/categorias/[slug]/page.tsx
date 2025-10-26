import Image from "next/image";
import { getCategoryLandingBySlug } from "@/server/actions/categories";
import ProductCard from "@/components/product-card";
import Link from "next/link";
import { shimmer, toBase64 } from "@/lib/image-placeholder";
import { getSettings } from "@/server/actions/settings";

export default async function CategoryLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCategoryLandingBySlug(slug);
  const settings = await getSettings();
  const tasa = Number((settings as any).tasaVES || 40);
  if (!data) return <div className="container mx-auto px-4 py-12">Categoría no encontrada.</div>;
  const { category, products } = data as any;
  const children = Array.isArray(category.children) ? category.children : [];

  return (
    <div className="bg-gray-50">
      {/* Banner */}
      <div className="relative w-full h-48 md:h-64 bg-gray-200">
        {category.bannerUrl ? (
          <Image
            src={category.bannerUrl}
            alt={category.name}
            fill
            sizes="100vw"
            className="object-cover"
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(1600, 400, 0))}`}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{category.name}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {category.description && (
          <p className="text-gray-700 max-w-3xl mb-6">{category.description}</p>
        )}

        {/* Chips de subcategorías */}
        {children.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {children.map((c: any) => (
              <Link key={c.id} href={`/productos?categoria=${c.slug}`} className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 text-sm">
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {/* Productos destacados de la categoría */}
        {products.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Productos destacados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(0, 12).map((product: any) => (
                <ProductCard key={product.id} product={product} tasa={tasa} />
              ))}
            </div>
            <div className="mt-6">
              <Link href={`/productos?categoria=${category.slug}`} className="inline-block px-4 py-2 rounded bg-brand text-white hover:bg-opacity-90">Ver todos los productos</Link>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">No hay productos en esta categoría.</div>
        )}
      </div>
    </div>
  );
}

