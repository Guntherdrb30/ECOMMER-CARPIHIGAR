import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
      return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 401 });
    }
    const id = ctx.params?.id;
    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    const messages = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 500 });
    return NextResponse.json({ ok: true, messages: messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

