'use server';

import prisma from '@/lib/prisma';
import { unstable_cache as unstableCache } from 'next/cache';

type Banner = { name: string; slug: string; href: string; image: string };

export const getFeaturedCategoryBanners = unstableCache(async (): Promise<Banner[]> => {
  const slugs = ['carpinteria', 'hogar'];
  const out: Banner[] = [];
  const windowKey = Math.floor(Date.now() / (2 * 60 * 60 * 1000)); // 2h window
  for (const slug of slugs) {
    try {
      const cat = await prisma.category.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } });
      if (!cat) {
        out.push({ name: slug === 'hogar' ? 'Hogar' : 'Carpintería', slug, href: `/productos?categoria=${slug}`, image: '' });
        continue;
      }
      const prods = await prisma.product.findMany({
        where: { categoryId: cat.id, NOT: { images: { isEmpty: true } } } as any,
        select: { images: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      let image = '';
      if (prods.length) {
        const salt = Array.from(slug).reduce((s, ch) => s + ch.charCodeAt(0), 0);
        const idx = (windowKey + salt) % prods.length;
        image = prods[idx].images[0] || '';
      }
      out.push({ name: cat.name || (slug === 'hogar' ? 'Hogar' : 'Carpintería'), slug, href: `/productos?categoria=${slug}`, image });
    } catch {
      out.push({ name: slug === 'hogar' ? 'Hogar' : 'Carpintería', slug, href: `/productos?categoria=${slug}`, image: '' });
    }
  }
  return out;
}, ['featured-category-banners-v3'], { revalidate: 2 * 60 * 60 });

