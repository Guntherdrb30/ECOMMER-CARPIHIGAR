import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const category = (url.searchParams.get('category') || '').trim();
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');

    const where: any = { status: 'ACTIVE' as any };

    const or: any[] = [];
    if (q) {
      or.push({ name: { contains: q, mode: 'insensitive' } });
      or.push({ sku: { contains: q, mode: 'insensitive' } as any });
      or.push({ code: { contains: q, mode: 'insensitive' } as any });
      or.push({ keywords: { has: q } as any });
    }
    if (or.length) {
      where.OR = or;
    }

    if (category) {
      where.category = {
        OR: [
          { slug: { equals: category, mode: 'insensitive' } },
          { name: { contains: category, mode: 'insensitive' } },
        ],
      } as any;
    }

    if (minPrice) {
      const num = parseFloat(minPrice);
      if (!isNaN(num)) {
        where.priceUSD = { ...(where.priceUSD || {}), gte: num as any };
      }
    }

    if (maxPrice) {
      const num = parseFloat(maxPrice);
      if (!isNaN(num)) {
        where.priceUSD = { ...(where.priceUSD || {}), lte: num as any };
      }
    }

    const products = await prisma.product.findMany({
      where,
      take: 40,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });

    const items = products.map((p) => {
      const primaryImage = (p.images || [])[0] || '';
      return {
        id: p.id,
        name: p.name,
        code: p.code || p.sku || '',
        price: Number(p.priceUSD as any) || 0,
        imageUrl: primaryImage,
        category: p.category?.name || undefined,
      };
    });

    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || 'error') },
      { status: 500 },
    );
  }
}

