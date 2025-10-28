'use server';

import prisma from '@/lib/prisma';

export type NewsItem = {
  id: string;
  imageUrl: string;
  title: string | null;
  excerpt: string | null;
  // Use string to keep RSC serialization safe
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    profileImageUrl: string | null;
  };
};

export async function getLatestNews(limit = 12): Promise<NewsItem[]> {
  try {
    const items = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: { select: { id: true, name: true, profileImageUrl: true } } },
    });
    return items.map((n) => ({
      id: n.id,
      imageUrl: n.imageUrl,
      title: n.title,
      excerpt: n.excerpt,
      createdAt: (n as any).createdAt instanceof Date ? (n as any).createdAt.toISOString() : String((n as any).createdAt),
      author: {
        id: (n as any).author?.id ?? '',
        name: (n as any).author?.name ?? null,
        profileImageUrl: (n as any).author?.profileImageUrl ?? null,
      },
    }));
  } catch (e) {
    console.warn('[getLatestNews] failed, returning empty array', e);
    return [];
  }
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    const n = await prisma.news.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, profileImageUrl: true } } },
    });
    if (!n) return null;
    return {
      id: n.id,
      imageUrl: n.imageUrl,
      title: n.title,
      excerpt: n.excerpt,
      createdAt: (n as any).createdAt instanceof Date ? (n as any).createdAt.toISOString() : String((n as any).createdAt),
      author: {
        id: (n as any).author?.id ?? '',
        name: (n as any).author?.name ?? null,
        profileImageUrl: (n as any).author?.profileImageUrl ?? null,
      },
    };
  } catch (e) {
    console.warn('[getNewsById] failed, returning null', e);
    return null;
  }
}


