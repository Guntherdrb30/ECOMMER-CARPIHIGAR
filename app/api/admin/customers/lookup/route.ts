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
  const emailRaw = String(searchParams.get('email') || '').trim();
  const phoneRaw = String(searchParams.get('phone') || '').trim();
  const taxIdRaw = String(searchParams.get('taxId') || '').trim();

  if (!emailRaw && !phoneRaw && !taxIdRaw) {
    return NextResponse.json({ user: null, fiscal: null, addresses: [] });
  }

  try {
    let user: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
    } | null = null;

    const email = emailRaw.toLowerCase();
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, phone: true },
      });
    }

    const taxId = taxIdRaw || undefined;
    if (!user && taxId) {
      const previousOrder = await prisma.order.findFirst({
        where: { customerTaxId: { contains: taxId, mode: 'insensitive' } as any },
        orderBy: { createdAt: 'desc' },
        select: { userId: true },
      });
      if (previousOrder?.userId) {
        const u = await prisma.user.findUnique({
          where: { id: previousOrder.userId },
          select: { id: true, name: true, email: true, phone: true },
        });
        if (u) {
          user = u;
        }
      }
    }

    const phone = phoneRaw || undefined;
    if (!user && phone) {
      user = await prisma.user.findFirst({
        where: { phone },
        select: { id: true, name: true, email: true, phone: true },
      });
    }

    if (!user) {
      return NextResponse.json({ user: null, fiscal: null, addresses: [] });
    }

    const fiscal = await prisma.order.findFirst({
      where: { userId: user.id, customerTaxId: { not: null } as any },
      orderBy: { createdAt: 'desc' },
      select: { customerTaxId: true, customerFiscalAddress: true },
    });

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullname: true,
        phone: true,
        state: true,
        city: true,
        zone: true,
        address1: true,
        address2: true,
        notes: true,
      },
    });

    return NextResponse.json({ user, fiscal, addresses });
  } catch (e) {
    return NextResponse.json(
      { user: null, fiscal: null, addresses: [], error: String(e) },
      { status: 500 },
    );
  }
}

