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

    const convo = await prisma.conversation.findUnique({ where: { id }, include: { user: true, assignedTo: true } });
    if (!convo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    const msgs = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 2000 });

    const payload = {
      conversation: {
        id: convo.id,
        phone: convo.phone,
        channel: convo.channel,
        status: convo.status,
        user: convo.user ? { id: convo.user.id, name: convo.user.name, email: convo.user.email, phone: convo.user.phone } : null,
        assignedTo: convo.assignedTo ? { id: convo.assignedTo.id, name: convo.assignedTo.name, email: convo.assignedTo.email } : null,
        createdAt: convo.createdAt.toISOString(),
        updatedAt: convo.updatedAt.toISOString(),
        lastMessageAt: convo.lastMessageAt ? convo.lastMessageAt.toISOString() : null,
      },
      messages: msgs.map(m => ({
        id: m.id,
        direction: m.direction,
        status: m.status,
        type: m.type,
        text: m.text,
        mediaUrl: m.mediaUrl,
        waMessageId: m.waMessageId,
        actor: (m as any).actor || null,
        metadata: (m as any).metadata || null,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    const res = NextResponse.json(payload);
    res.headers.set('Content-Disposition', `attachment; filename="convo_${convo.id}_transcript.json"`);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

