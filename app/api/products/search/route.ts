import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  // Require admin or vendedor to use this endpoint in admin context
  const session = (await getServerSession(authOptions as any)) as any;
  const role = session?.user?.role as string | undefined;
  if (!session || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const where: any = q
    ? { OR: [ { name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } } ] }
    : {};
  const items = await prisma.product.findMany({
    where,
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, sku: true, priceUSD: true, priceAllyUSD: true },
  });
  return NextResponse.json(items);
}
