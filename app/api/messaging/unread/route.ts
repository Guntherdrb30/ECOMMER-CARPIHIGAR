import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
      return NextResponse.json({ unread: 0 }, { status: 200 });
    }
    const agg: any = await prisma.conversation.aggregate({ _sum: { unreadAgent: true } });
    const unread = Number(agg?._sum?.unreadAgent || 0);
    return NextResponse.json({ unread });
  } catch (e) {
    return NextResponse.json({ unread: 0 });
  }
}

