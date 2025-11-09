import prisma from '@/lib/prisma';
import { log } from '../../utils/logger';

export async function searchProducts(queryText: string) {
  const q = String(queryText || '').trim();
  if (!q) return [] as any[];
  try {
    const items = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, slug: true, images: true, priceClientUSD: true, priceUSD: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const mapped = items.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      images: p.images || [],
      priceUSD: typeof p.priceClientUSD === 'object' && p.priceClientUSD !== null ? Number(p.priceClientUSD) : (typeof p.priceUSD === 'object' && p.priceUSD !== null ? Number(p.priceUSD) : undefined),
    }));
    log('products.search', { q, count: mapped.length });
    return mapped;
  } catch (e: any) {
    log('products.search.error', { q, error: String(e?.message || e) });
    return [] as any[];
  }
}
