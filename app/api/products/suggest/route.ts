import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ ok: true, items: [] });

  const tokens = q.split(/\s+/).filter(Boolean);
  const where: any = tokens.length
    ? { AND: tokens.map((t) => ({ OR: [
        { name: { contains: t, mode: 'insensitive' } },
        { sku: { contains: t, mode: 'insensitive' } },
        { code: { contains: t, mode: 'insensitive' } },
      ] })) }
    : {};

  const rows = await prisma.product.findMany({
    where,
    select: { id: true, name: true, slug: true, images: true, stock: true, priceUSD: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    image: (r as any).images?.[0] || '',
    stock: r.stock,
    priceUSD: Number((r as any).priceUSD ?? 0),
  }));
  return NextResponse.json({ ok: true, items });
}

