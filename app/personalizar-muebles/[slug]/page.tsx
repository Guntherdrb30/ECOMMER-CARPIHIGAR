import { notFound } from 'next/navigation';
import { getConfigurableProductBySlug } from '@/server/actions/ecpd';
import { getSettings } from '@/server/actions/settings';
import ConfiguratorUI from '../components/ConfiguratorUI';
import { ProductSchema, type ProductSchemaType } from '../lib/ProductSchema';

export const metadata = {
  title: 'Personalizar mueble | Carpihogar',
};

export default async function PersonalizarMuebleBySlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getConfigurableProductBySlug(params.slug);
  if (!product) {
    notFound();
  }
  const settings = await getSettings();
  const tasa = Number((settings as any).tasaVES ?? 1);

  const baseSchema: ProductSchemaType = ProductSchema;
  const dbSchema = (product as any).configSchema as any | null;
  const schema: ProductSchemaType = dbSchema
    ? ({
        ...baseSchema,
        ...dbSchema,
        name: dbSchema.name || product.name,
      } as ProductSchemaType)
    : { ...baseSchema, name: product.name };

  const priceDb = (product as any).priceUSD;
  const priceNumber =
    typeof priceDb === 'number'
      ? (priceDb as number)
      : priceDb?.toNumber?.() ?? schema.pricing.referencePrice;
  schema.pricing.referencePrice = priceNumber;

  const images: string[] = Array.isArray((product as any).images)
    ? ((product as any).images as string[])
    : [];

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4 space-y-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.25em] text-brand uppercase mb-2">
            ECPD · Personalizar mueble
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            {product.name}
          </h1>
          {product.description && (
            <p className="text-gray-600">
              {(product.description as string).slice(0, 220)}
            </p>
          )}
        </header>
        <ConfiguratorUI
          schema={schema}
          tasa={tasa}
          productId={product.id}
          productName={product.name}
          productImages={images}
        />
      </div>
    </div>
  );
}

