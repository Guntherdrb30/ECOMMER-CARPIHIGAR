import { NextResponse } from 'next/server';
import { getTopSuppliersByInventory } from '@/server/actions/inventory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get('cat') || searchParams.get('categoria') || undefined;
  const limit = Number(searchParams.get('limit') || 1);
  const data = await getTopSuppliersByInventory({ categorySlug: categorySlug || undefined, limit });
  const top = data.rows?.[0] || null;
  return NextResponse.json({
    supplier: top?.supplier || null,
    totalValueUSD: top?.totalValueUSD || 0,
  });
}

