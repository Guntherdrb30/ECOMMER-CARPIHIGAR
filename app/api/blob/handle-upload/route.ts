import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN faltante en el entorno' }, { status: 400 });
    }
    const res = await handleUpload({
      request,
      token,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['image/*', 'video/*', 'application/pdf', 'text/csv'],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
        };
      },
      onUploadCompleted: async ({ blob }) => {
        try { console.log('[blob] upload completed', blob.pathname); } catch {}
      },
    });
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[blob] handle-upload error', err?.message || err);
    return NextResponse.json({ error: 'Blob handle-upload failed', details: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    return NextResponse.json({ ok: true, hasToken });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
