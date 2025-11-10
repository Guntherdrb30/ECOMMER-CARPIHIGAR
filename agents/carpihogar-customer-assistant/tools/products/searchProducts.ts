import prisma from '@/lib/prisma';
import { log } from '../../utils/logger';


\nfunction stripDiacritics(s: string): string { try { return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''); } catch { return s; } }\n
  try {
    const items = await prisma.product.findMany({
      where: {
        AND: terms.map(t => ({
          OR: [
            { name: { contains: t, mode: 'insensitive' } },
            { description: { contains: t, mode: 'insensitive' } },
            { sku: { contains: t, mode: 'insensitive' } },
            { code: { contains: t, mode: 'insensitive' } },
          ],
        })),
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
      priceUSD: (p.priceClientUSD as any) ? Number(p.priceClientUSD) : ((p.priceUSD as any) ? Number(p.priceUSD) : undefined),
    }));
    log('products.search', { q, terms, count: mapped.length });
    return mapped;
  } catch (e: any) {
    log('products.search.error', { q, error: String(e?.message || e) });
    return [] as any[];
  }
}


