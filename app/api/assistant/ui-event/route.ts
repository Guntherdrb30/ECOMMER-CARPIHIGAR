import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key || '');
  // Here we could notify MCP or analytics. For now, echo.
  return NextResponse.json({ ok: true, key });
}

