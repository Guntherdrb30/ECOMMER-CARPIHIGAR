import { getTrendingProducts } from '@/server/actions/products';
import { getSettings } from '@/server/actions/settings';
import ProductCard from '@/components/product-card';

export default async function TrendingProducts() {
  const [products, settings] = await Promise.all([
    getTrendingProducts(9, 60),
    getSettings(),
  ]);

  if (!products.length) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">Tendencias</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
          {products.slice(0, 9).map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              tasa={(settings as any).tasaVES}
              whatsappPhone={(settings as any).whatsappPhone}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
