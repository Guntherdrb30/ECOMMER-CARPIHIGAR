import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/app/api/moodboard/_utils';

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'AUTH_REQUIRED', message: 'Debes iniciar sesión para guardar diseños.' },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const productId = String(body.productId || '').trim();
    const spaceImageUrl = String(body.spaceImageUrl || '').trim();
    const config = body.config;
    const overlay = body.overlay || {};
    const price = Number(body.priceUSD || 0);

    if (!productId || !spaceImageUrl || !config || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: 'INVALID_DATA', message: 'Faltan datos para guardar el diseño.' },
        { status: 400 },
      );
    }

    const totalDesigns = await prisma.ecpdDesign.count({
      where: { userId },
    });

    if (totalDesigns >= 5) {
      return NextResponse.json(
        {
          error: 'LIMIT_REACHED',
          message:
            'Ya tienes 5 diseños guardados. Elimina alguno en "Mis diseños personalizados" antes de guardar uno nuevo.',
        },
        { status: 400 },
      );
    }

    const overlayX = typeof overlay.x === 'number' ? overlay.x : 0.5;
    const overlayY = typeof overlay.y === 'number' ? overlay.y : 0.5;
    const overlayScale = typeof overlay.scale === 'number' ? overlay.scale : 1;
    const overlayRotation = typeof overlay.rotation === 'number' ? overlay.rotation : 0;

    const record = await prisma.ecpdDesign.create({
      data: {
        userId,
        productId,
        spaceImageUrl,
        config,
        overlayX,
        overlayY,
        overlayScale,
        overlayRotation,
        priceUSD: price as any,
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true, images: true, sku: true },
        },
      },
    });

    return NextResponse.json({
      id: record.id,
      userId: record.userId,
      productId: record.productId,
      spaceImageUrl: record.spaceImageUrl,
      overlay: {
        x: record.overlayX,
        y: record.overlayY,
        scale: record.overlayScale,
        rotation: record.overlayRotation,
      },
      priceUSD: Number(record.priceUSD as any),
      createdAt: record.createdAt.toISOString(),
      product: {
        id: record.product.id,
        name: record.product.name,
        slug: record.product.slug,
        sku: record.product.sku,
        image: Array.isArray(record.product.images)
          ? (record.product.images as string[])[0]
          : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: String(e?.message || e || 'error') },
      { status: 500 },
    );
  }
}

