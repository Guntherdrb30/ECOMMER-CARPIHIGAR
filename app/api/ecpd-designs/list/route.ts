import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/app/api/moodboard/_utils';

export async function GET(req: Request) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json([]);
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
      userId: d.userId,
      productId: d.productId,
      productName: d.product.name,
      productSlug: d.product.slug,
      productSku: d.product.sku,
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

    return NextResponse.json(mapped);
  } catch (e: any) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: String(e?.message || e || 'error') },
      { status: 500 },
    );
  }
}

