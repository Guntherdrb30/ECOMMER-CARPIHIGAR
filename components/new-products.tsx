import { getProducts } from '@/server/actions/products';
import { getSettings } from '@/server/actions/settings';
import RelatedProductsCarousel from './related-products-carousel';

export default async function NewProducts() {
  const [newProducts, settings] = await Promise.all([
    getProducts({ isNew: true }),
    getSettings(),
  ]);

  // We need to serialize the products and settings
  const serializableProducts = newProducts.map((p: any) => ({
    ...p,
    priceUSD: p.priceUSD.toNumber(),
    priceAllyUSD: p.priceAllyUSD?.toNumber() || null,
    avgCost: p.avgCost?.toNumber() || null,
    lastCost: p.lastCost?.toNumber() || null,
  }));

  const serializableSettings = {
    ...settings,
    ivaPercent: (settings as any).ivaPercent.toNumber(),
    tasaVES: (settings as any).tasaVES.toNumber(),
    sellerCommissionPercent: (settings as any).sellerCommissionPercent.toNumber(),
  };

  if (!serializableProducts.length) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Nuevos Productos</h2>
        <RelatedProductsCarousel products={serializableProducts} settings={serializableSettings} />
      </div>
    </section>
  );
}
