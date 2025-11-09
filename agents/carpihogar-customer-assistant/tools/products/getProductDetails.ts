import prisma from '@/lib/prisma';
import { log } from '../../utils/logger';

export async function getProductDetails(productId: string) {
  try {
    const p = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true, description: true, images: true, priceClientUSD: true, priceUSD: true },
    });
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      images: p.images || [],
      priceUSD: typeof (p as any).priceClientUSD === 'object' && (p as any).priceClientUSD !== null ? Number((p as any).priceClientUSD) : (typeof (p as any).priceUSD === 'object' && (p as any).priceUSD !== null ? Number((p as any).priceUSD) : undefined),
    };
  } catch (e: any) {
    log('products.detail.error', { productId, error: String(e?.message || e) });
    return null;
  }
}
