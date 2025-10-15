import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUploadUrl } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { url } = await createUploadUrl({ access: 'public' });
    return NextResponse.json({ url });
  } catch (err) {
    console.error('[blob] createUploadUrl error', err);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}

