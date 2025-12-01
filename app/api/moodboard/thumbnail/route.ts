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
        { error: 'Debes iniciar sesion para actualizar miniaturas.' },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const moodboardId = String(body.moodboardId || '').trim();
    const dataUrl = String(body.dataUrl || '').trim();
    if (!moodboardId || !dataUrl) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Por ahora guardamos el dataURL directamente. En el futuro se puede sustituir
    // por una URL pública generada al subir la imagen a Blob Storage.
    await prisma.moodboard.update({
      where: { id: moodboardId, userId },
      data: { thumbnail: dataUrl },
    } as any);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || 'error') },
      { status: 500 },
    );
  }
}
