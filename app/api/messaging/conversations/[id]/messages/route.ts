import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const id = params?.id;
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
  try {
    const messages = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 500 });
    return NextResponse.json({ ok: true, messages });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 200 });
  }
}

