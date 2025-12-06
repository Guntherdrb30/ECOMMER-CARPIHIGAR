import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getSettings } from '@/server/actions/settings';
import ConfiguratorUI from '../../components/ConfiguratorUI';
import {
  ProductSchema,
  type ProductSchemaType,
  type ProductConfig,
} from '../../lib/ProductSchema';

export default async function PersonalizarDesdeDisenoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    redirect(
      `/auth/login?callbackUrl=${encodeURIComponent(
        `/personalizar-muebles/diseno/${params.id}`,
      )}`,
    );
  }

  const design = await prisma.ecpdDesign.findFirst({
    where: { id: params.id, userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          images: true,
          priceUSD: true,
          widthCm: true,
          heightCm: true,
          depthCm: true,
          isConfigurable: true,
          configSchema: true,
          sku: true,
        },
      },
    },
  } as any);

  if (!design || !(design.product as any).isConfigurable) {
    notFound();
  }

  const settings = await getSettings();
  const tasa = Number((settings as any).tasaVES ?? 1);
  const whatsappPhone =
    ((settings as any).whatsappPhone as string | undefined) || undefined;
  const ecpdColors = Array.isArray((settings as any).ecpdColors)
    ? ((settings as any).ecpdColors as any[])
    : [];

  const baseSchema: ProductSchemaType = ProductSchema;
  const dbSchema = (design.product as any).configSchema as any | null;
  const schema: ProductSchemaType = dbSchema
    ? ({
        ...baseSchema,
        ...dbSchema,
        name: dbSchema.name || design.product.name,
      } as ProductSchemaType)
    : { ...baseSchema, name: design.product.name };

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

  const priceDb = (design.product as any).priceUSD;
  const priceNumber =
    typeof priceDb === 'number'
      ? (priceDb as number)
      : priceDb?.toNumber?.() ?? schema.pricing.referencePrice;
  schema.pricing.referencePrice = priceNumber;

  const dims = schema.dimensions;
  const originalConfig = design.config as any as ProductConfig;

  const widthInitial = Math.min(
    Math.max(originalConfig.dimensions.width, dims.width.min),
    dims.width.max,
  );
  const depthInitial = Math.min(
    Math.max(originalConfig.dimensions.depth, dims.depth.min),
    dims.depth.max,
  );
  const heightInitial = Math.min(
    Math.max(originalConfig.dimensions.height, dims.height.min),
    dims.height.max,
  );

  (schema as any).initialDimensions = {
    width: widthInitial,
    depth: depthInitial,
    height: heightInitial,
  };

  schema.pricing.referenceVolume =
    widthInitial * depthInitial * heightInitial;

  const initialConfig: ProductConfig = {
    ...originalConfig,
    dimensions: {
      width: widthInitial,
      depth: depthInitial,
      height: heightInitial,
    },
  };

  const images: string[] = Array.isArray((design.product as any).images)
    ? ((design.product as any).images as string[])
    : [];

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4 space-y-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.25em] text-brand uppercase mb-2">
            ECPD · Diseño personalizado guardado
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            {design.product.name}
          </h1>
          <p className="text-gray-600">
            Estás viendo un diseño que guardaste anteriormente. Puedes ajustar
            medidas, color y posición del mueble en tu espacio, volver a
            guardarlo o agregarlo al carrito.
          </p>
        </header>
        <ConfiguratorUI
          schema={schema}
          tasa={tasa}
          productId={design.productId}
          productName={design.product.name}
          productImages={images}
          ecpdColors={ecpdColors}
          whatsappPhone={whatsappPhone}
          productSku={(design.product as any).sku || null}
          initialConfig={initialConfig}
          initialSpaceImageUrl={design.spaceImageUrl}
          initialOverlay={{
            x: design.overlayX,
            y: design.overlayY,
            scale: design.overlayScale,
            rotation: design.overlayRotation,
          }}
          canSaveDesign={true}
        />
      </div>
    </div>
  );
}

