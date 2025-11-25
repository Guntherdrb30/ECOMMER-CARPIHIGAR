import { getProducts } from '@/server/actions/products';
import { getSettings } from '@/server/actions/settings';
import ProductCard from '@/components/product-card';

export default async function NewProducts() {
  const [newProducts, settings] = await Promise.all([
    getProducts({ isNew: true }),
    getSettings(),
  ]);

  // Ensure products are serializable, handling both Decimal and number cases
  const serializableProducts = newProducts.map((p: any) => ({
    ...p,
    priceUSD: typeof p.priceUSD === 'number' ? p.priceUSD : p.priceUSD?.toNumber?.() ?? Number(p.priceUSD),
    priceAllyUSD: typeof p.priceAllyUSD === 'number' ? p.priceAllyUSD : p.priceAllyUSD?.toNumber?.() ?? (p.priceAllyUSD ? Number(p.priceAllyUSD) : null),
    avgCost: typeof p.avgCost === 'number' ? p.avgCost : p.avgCost?.toNumber?.() ?? (p.avgCost ? Number(p.avgCost) : null),
    lastCost: typeof p.lastCost === 'number' ? p.lastCost : p.lastCost?.toNumber?.() ?? (p.lastCost ? Number(p.lastCost) : null),
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 lg:gap-6">
          {serializableProducts.slice(0, 20).map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              tasa={(serializableSettings as any).tasaVES}
              whatsappPhone={(serializableSettings as any).whatsappPhone}
              compact
              isWishlisted={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
