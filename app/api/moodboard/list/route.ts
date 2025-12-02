import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/app/api/moodboard/_utils';

export async function GET(req: Request) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const items = await prisma.moodboard.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const mapped = items.map((m) => {
      const raw = m.jsonData as any;
      const elements = Array.isArray(raw)
        ? (raw as any[])
        : Array.isArray(raw?.elements)
        ? (raw.elements as any[])
        : [];
      const backgroundColor =
        typeof raw?.backgroundColor === 'string' ? (raw.backgroundColor as string) : undefined;

      return {
        id: m.id,
        title: m.title,
        userId: m.userId,
        thumbnailUrl: m.thumbnail || undefined,
        backgroundColor,
        elements,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(mapped);
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || 'error') },
      { status: 500 },
    );
  }
}
