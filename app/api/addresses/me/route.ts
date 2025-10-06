import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  try {
    const userId = (session.user as any)?.id as string;
    const addresses = await prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(addresses);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

