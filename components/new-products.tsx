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
    ivaPercent: typeof (settings as any).ivaPercent === 'number'
      ? (settings as any).ivaPercent
      : (settings as any).ivaPercent?.toNumber?.() ?? Number((settings as any).ivaPercent),
    tasaVES: typeof (settings as any).tasaVES === 'number'
      ? (settings as any).tasaVES
      : (settings as any).tasaVES?.toNumber?.() ?? Number((settings as any).tasaVES),
    sellerCommissionPercent: typeof (settings as any).sellerCommissionPercent === 'number'
      ? (settings as any).sellerCommissionPercent
      : (settings as any).sellerCommissionPercent?.toNumber?.() ?? Number((settings as any).sellerCommissionPercent),
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
