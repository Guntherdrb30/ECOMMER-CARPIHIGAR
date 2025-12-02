import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/app/api/moodboard/_utils';

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Debes iniciar sesion para guardar tus moodboards.' },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const id = typeof body.id === 'string' && body.id.trim().length ? body.id.trim() : undefined;
    const titleRaw = String(body.title || '').trim();
    const title = titleRaw || 'Moodboard sin titulo';
    const elements = Array.isArray(body.elements) ? body.elements : [];
    const backgroundColor =
      typeof body.backgroundColor === 'string' && body.backgroundColor.trim().length
        ? (body.backgroundColor as string)
        : '#f9fafb';
    const thumbnailDataUrl =
      typeof body.thumbnailDataUrl === 'string' && body.thumbnailDataUrl.trim().length
        ? (body.thumbnailDataUrl as string)
        : undefined;

    if (!elements.length) {
      return NextResponse.json(
        { error: 'El moodboard debe tener al menos un elemento.' },
        { status: 400 },
      );
    }

    const jsonData: any = {
      elements,
      backgroundColor,
    };

    let record;
    if (id) {
      record = await prisma.moodboard.update({
        where: { id, userId },
        data: {
          title,
          jsonData,
          thumbnail: thumbnailDataUrl ?? undefined,
        },
      });
    } else {
      record = await prisma.moodboard.create({
        data: {
          userId,
          title,
          jsonData,
          thumbnail: thumbnailDataUrl ?? undefined,
        },
      });
    }

    const raw = record.jsonData as any;
    const elementsOut = Array.isArray(raw)
      ? (raw as any[])
      : Array.isArray(raw?.elements)
      ? (raw.elements as any[])
      : [];
    const backgroundColorOut =
      typeof raw?.backgroundColor === 'string' ? (raw.backgroundColor as string) : undefined;

    const mapped = {
      id: record.id,
      title: record.title,
      userId: record.userId,
      thumbnailUrl: record.thumbnail || undefined,
      backgroundColor: backgroundColorOut,
      elements: elementsOut,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };

    return NextResponse.json(mapped);
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || 'error') },
      { status: 500 },
    );
  }
}
