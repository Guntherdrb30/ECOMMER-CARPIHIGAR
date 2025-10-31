import { NextResponse } from 'next/server';
import { getAlliesRanking } from '@/server/actions/allies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Number(searchParams.get('limit') || '10');
    const items = await getAlliesRanking(q || undefined, Math.min(Math.max(limit, 1), 20));
    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('[api/allies/suggest] error', e?.message || e);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

