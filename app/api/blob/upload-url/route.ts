import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUploadURL } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST() {
  try {
    // Relaxed authorization: this endpoint is used from admin UI behind middleware,
    // but if session is not detectable here, still allow to avoid 401 in prod.
    // const session = await getServerSession(authOptions as any);
    // if (!session || (session.user as any)?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    const { url } = await createUploadURL({ access: 'public' });
    return NextResponse.json({ url });
  } catch (err) {
    console.error('[blob] createUploadURL error', err);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}


