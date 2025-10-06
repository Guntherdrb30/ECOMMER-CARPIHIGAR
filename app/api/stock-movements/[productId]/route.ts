import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const url = new URL(req.url);
  const take = parseInt(url.searchParams.get('take') || '20', 10);
  const items = await prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take,
  });
  return NextResponse.json({ items });
}
