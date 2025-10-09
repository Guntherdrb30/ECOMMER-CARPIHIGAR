import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
    return NextResponse.json({ unread: 0 }, { status: 401 });
  }
  try {
    const agg = await prisma.conversation.aggregate({ _sum: { unreadAgent: true } });
    const unread = Number((agg as any)?._sum?.unreadAgent || 0);
    return NextResponse.json({ unread });
  } catch (e: any) {
    return NextResponse.json({ unread: 0, error: String(e) }, { status: 200 });
  }
}

