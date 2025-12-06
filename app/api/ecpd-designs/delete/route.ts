import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/app/api/moodboard/_utils';

export async function DELETE(req: Request) {
  if (req.method !== 'DELETE') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'AUTH_REQUIRED', message: 'Debes iniciar sesión para eliminar diseños.' },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const id = (url.searchParams.get('id') || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    try {
      await prisma.ecpdDesign.delete({
        where: { id, userId },
      } as any);
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: String(e?.message || e || 'error') },
      { status: 500 },
    );
  }
}

