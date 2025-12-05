import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '');
  if (!['ADMIN', 'VENDEDOR', 'ALIADO'].includes(role)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get('q') || '').trim();
  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const where: any = {
      OR: [
        { name: { contains: q, mode: 'insensitive' } as any },
        { email: { contains: q, mode: 'insensitive' } as any },
        { phone: { contains: q, mode: 'insensitive' } as any },
        {
          orders: {
            some: {
              customerTaxId: { contains: q, mode: 'insensitive' } as any,
            },
          },
        },
      ],
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(users);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 },
    );
  }
}

