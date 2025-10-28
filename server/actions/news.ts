'use server';

import prisma from '@/lib/prisma';

export type NewsItem = {
  id: string;
  imageUrl: string;
  title: string | null;
  excerpt: string | null;
  createdAt: Date;
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
    return items as any;
  } catch (e) {
    console.warn('[getLatestNews] failed, returning empty array', e);
    return [];
  }
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    const item = await prisma.news.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, profileImageUrl: true } } },
    });
    return (item as any) || null;
  } catch (e) {
    console.warn('[getNewsById] failed, returning null', e);
    return null;
  }
}


