import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const user = session?.user as any;
    if (!user?.id || user?.role !== 'ALIADO') {
      return NextResponse.json(
        { error: 'Solo los aliados pueden publicar en Novedades.' },
        { status: 403 },
      );
    }
    if (!(user as any)?.emailVerified) {
      return NextResponse.json(
        { error: 'Debes verificar tu correo para publicar en Novedades.' },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const imageDataUrl = String(body.imageDataUrl || '').trim();
    const titleRaw = String(body.title || '').trim();
    const excerptRaw = String(body.excerpt || '').trim();

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'missing_image' }, { status: 400 });
    }

    // Opcional: limitar a 1 noticia por día por aliado
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const todayCount = await prisma.news.count({
      where: { authorId: user.id, createdAt: { gte: start, lt: tomorrow } },
    });
    if (todayCount > 0) {
      return NextResponse.json(
        { error: 'Ya publicaste una novedad hoy. Inténtalo mañana.' },
        { status: 429 },
      );
    }

    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });

    const news = await prisma.news.create({
      data: {
        authorId: user.id,
        imageUrl: imageDataUrl,
        title: titleRaw || `Moodboard de ${me?.name || 'aliado'}`,
        excerpt: excerptRaw || null,
      },
    });

    try {
      revalidatePath('/novedades');
    } catch {}

    return NextResponse.json({ ok: true, id: news.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || 'error') },
      { status: 500 },
    );
  }
}

