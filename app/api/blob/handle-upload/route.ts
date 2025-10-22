import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await handleUpload({
      request,
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        return {
          allowedContentTypes: ['image/*', 'video/*', 'application/pdf', 'text/csv'],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year
          // validUntil: Date.now() + 5 * 60_000, // Optional short-lived token
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // No-op: the admin forms capture the returned URL via client
        // You could persist metadata here if needed.
        console.log('[blob] upload completed', blob.pathname);
      },
    });
    return NextResponse.json(res);
  } catch (err) {
    console.error('[blob] handle-upload error', err);
    return NextResponse.json({ error: 'Blob handle-upload failed' }, { status: 500 });
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
