import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = String(searchParams.get('ids') || '').trim();
    const slugsParam = String(searchParams.get('slugs') || '').trim();
    const ids = idsParam ? idsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    const slugs = slugsParam ? slugsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!ids.length && !slugs.length) {
      return NextResponse.json({ error: 'ids or slugs required' }, { status: 400 });
    }
    const where: any = {};
    if (ids.length) where.id = { in: ids };
    if (slugs.length) where.slug = { in: slugs };
    const rows = await prisma.product.findMany({ where, select: { id: true, slug: true, stock: true } });
    const stocks: Record<string, number> = {};
    for (const r of rows) stocks[r.id] = Number(r.stock || 0);
    return NextResponse.json({ ok: true, stocks, updatedAt: Date.now() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

