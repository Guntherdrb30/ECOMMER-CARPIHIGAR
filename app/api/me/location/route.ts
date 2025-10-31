import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  try {
    const userId = (session.user as any)?.id as string;
    const email = (session.user as any)?.email as string | undefined;
    const addr = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    const city = String(addr?.city || '');
    const isBarinas = /barinas/i.test(city);
    return NextResponse.json({ ok: true, city, isBarinas, hasAddress: !!addr, userId, email });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
