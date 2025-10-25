import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '');
  if (!['ADMIN','VENDEDOR','ALIADO'].includes(role)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const email = String(searchParams.get('email') || '').trim();
  if (!email) return NextResponse.json([]);
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json([]);
    const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(addresses);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

