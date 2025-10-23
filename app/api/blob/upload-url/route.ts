import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Disabled endpoint to avoid build-time warnings with older @vercel/blob versions.
// The app uses /api/blob/handle-upload with '@vercel/blob/client' instead.
export async function POST() {
  return NextResponse.json({ error: 'Direct upload URL creation not supported' }, { status: 501 });
}

export async function GET() {
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  return NextResponse.json({ ok: false, hasToken, error: 'Direct upload URL creation not supported' }, { status: 501 });
}




