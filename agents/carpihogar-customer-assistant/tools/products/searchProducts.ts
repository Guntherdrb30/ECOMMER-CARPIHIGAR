import prisma from '@/lib/prisma';
import { log } from '../../utils/logger';

const STOPWORDS = new Set([
  'hola','tienes','tiene','quiero','buscar','busca','necesito','que','de','la','el','los','las','para','por','un','una','unos','unas','en','con','me','ayuda','asesores','ver','producto','productos','hay','alguno','alguna'
]);

function stripDiacritics(s: string): string {
  try {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    return s;
  }
}

function normalizeTerms(q: string): string[] {
  const base = q
    .toLowerCase()
    .replace(/[\u00BF\?\u00A1\!\.,;:]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t))
    .map((t) => (t.length > 2 ? t : ''))
    .filter(Boolean);

  const extras = base.map((t) => (t.endsWith('s') ? t.slice(0, -1) : '')).filter(Boolean);
  const nodiac = base.map((t) => stripDiacritics(t));

  const synonyms: string[] = [];
  const joined = base.join(' ');
  if (/peinadora/.test(joined)) synonyms.push('tocador', 'vanity', 'mueble', 'banio', 'bano');
  if (/(mueble|vanity).*(ba(ñ|n)o)|ba(ñ|n)o.*(mueble|vanity)/.test(joined)) synonyms.push('vanity', 'mueble', 'bano', 'banio');

  return Array.from(new Set([...base, ...extras, ...nodiac, ...synonyms]));
}

export async function searchProducts(queryText: string) {
  const q = String(queryText || '').trim();
  const terms = normalizeTerms(q);
  if (!q || terms.length === 0) return [] as any[];
  try {
    const items = await prisma.product.findMany({
      where: {
        AND: terms.map((t) => ({
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


