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
  const ecpdColors = Array.isArray((settings as any).ecpdColors)
    ? ((settings as any).ecpdColors as any[])
    : [];

  const baseSchema: ProductSchemaType = ProductSchema;
  const dbSchema = (product as any).configSchema as any | null;
  const schema: ProductSchemaType = dbSchema
    ? ({
        ...baseSchema,
        ...dbSchema,
        name: dbSchema.name || product.name,
      } as ProductSchemaType)
    : { ...baseSchema, name: product.name };

  // Forzar que los colores estéticos del schema usen los definidos en ajustes (ecpdColors)
  // como base, manteniendo cualquier combinación de dos colores definida en el schema.
  if (Array.isArray(ecpdColors) && ecpdColors.length) {
    const baseColorNames = ecpdColors
      .map((c) => ((c as any)?.name || '').trim())
      .filter((n) => n.length > 0);
    if (baseColorNames.length) {
      const existingColors = schema.aesthetics.colors || [];
      const comboColors = existingColors.filter((opt) => opt.includes('+'));
      schema.aesthetics.colors = [...baseColorNames, ...comboColors];
    }
  }

  const priceDb = (product as any).priceUSD;
  const priceNumber =
    typeof priceDb === 'number'
      ? (priceDb as number)
      : priceDb?.toNumber?.() ?? schema.pricing.referencePrice;
  schema.pricing.referencePrice = priceNumber;

  // Determinar las medidas iniciales a usar en el configurador:
  // 1) Si el producto tiene heightCm / widthCm / depthCm > 0, usamos esas.
  // 2) Si no, usamos initialDimensions del schema si existen.
  // 3) Si tampoco, usamos las medidas m�nimas del schema.
  const productWidth = Number((product as any).widthCm ?? 0) || 0;
  const productDepth = Number((product as any).depthCm ?? 0) || 0;
  const productHeight = Number((product as any).heightCm ?? 0) || 0;

  const schemaInitial = (schema as any).initialDimensions as
    | { width: number; depth: number; height: number }
    | undefined;

  const dims = schema.dimensions;

  let widthInitial =
    productWidth > 0
      ? productWidth
      : schemaInitial?.width ?? dims.width.min;
  let depthInitial =
    productDepth > 0
      ? productDepth
      : schemaInitial?.depth ?? dims.depth.min;
  let heightInitial =
    productHeight > 0
      ? productHeight
      : schemaInitial?.height ?? dims.height.min;

  // Aseguramos que est�n dentro de los rangos permitidos del schema.
  widthInitial = Math.min(Math.max(widthInitial, dims.width.min), dims.width.max);
  depthInitial = Math.min(Math.max(depthInitial, dims.depth.min), dims.depth.max);
  heightInitial = Math.min(Math.max(heightInitial, dims.height.min), dims.height.max);

  (schema as any).initialDimensions = {
    width: widthInitial,
    depth: depthInitial,
    height: heightInitial,
  };

  schema.pricing.referenceVolume =
    widthInitial * depthInitial * heightInitial;

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
          ecpdColors={ecpdColors}
        />
      </div>
    </div>
  );
}



