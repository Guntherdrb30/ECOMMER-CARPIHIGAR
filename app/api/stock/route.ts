import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = (searchParams.get('ids') || '').trim();
    if (!idsParam) {
      return NextResponse.json({ stocks: {} }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ stocks: {} }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const rows = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, stock: true },
    });
    const map: Record<string, number> = {};
    for (const r of rows) map[r.id] = Number(r.stock || 0);
    // Include ids not found as 0 to avoid undefined client-side
    for (const id of ids) if (!(id in map)) map[id] = 0;
    return NextResponse.json({ stocks: map }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    const err = String(e?.message || e || 'unknown');
    console.error('[api/stock] error', err);
    return NextResponse.json({ error: 'stock_error' }, { status: 500 });
  }
}

