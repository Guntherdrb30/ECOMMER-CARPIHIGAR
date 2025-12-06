import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DesignsClient from './DesignsClient';

export default async function MisDisenosPersonalizadosPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return (
      <div className="p-4">
        Debes iniciar sesión para ver tus diseños personalizados.
      </div>
    );
  }

  const designs = await prisma.ecpdDesign.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      product: {
        select: { id: true, name: true, slug: true, images: true, sku: true },
      },
    },
  });

  const mapped = designs.map((d) => ({
    id: d.id,
    productId: d.productId,
    productName: d.product.name,
    productSlug: d.product.slug,
    productSku: d.product.sku as string | null,
    productImage: Array.isArray(d.product.images)
      ? (d.product.images as string[])[0]
      : null,
    spaceImageUrl: d.spaceImageUrl,
    overlay: {
      x: d.overlayX,
      y: d.overlayY,
      scale: d.overlayScale,
      rotation: d.overlayRotation,
    },
    priceUSD: Number(d.priceUSD as any),
    createdAt: d.createdAt.toISOString(),
  }));

  return <DesignsClient designs={mapped} />;
}

