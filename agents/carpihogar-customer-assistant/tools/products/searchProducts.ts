import prisma from '@/lib/prisma';
import { log } from '../../utils/logger';

const STOPWORDS = new Set([
  'hola','tienes','tiene','quiero','buscar','busca','necesito','que','de','la','el','los','las','para','por','un','una','unos','unas','en','con','me','ayuda','asesores','ver','producto','productos','hay','alguno','alguna'
]);

function normalizeTerms(q: string): string[] {
  const base = q
    .toLowerCase()
    .replace(/[¿?¡!.,;:]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t))
    .map((t) => t.length > 2 ? t : '')
    .filter(Boolean);
  // Add singulars for simple plurals (bisagras -> bisagra)
  const extras = base.map(t => t.endsWith('s') ? t.slice(0,-1) : '').filter(Boolean);
  // Handle ñ/n fallback (baño -> bano)
  const diacritics = base.map(t => t.replace('ñ','n'));
  return Array.from(new Set([...base, ...extras, ...diacritics]));
}

export async function searchProducts(queryText: string) {
  const q = String(queryText || '').trim();
  const terms = normalizeTerms(q);
  if (!q || terms.length === 0) return [] as any[];
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
