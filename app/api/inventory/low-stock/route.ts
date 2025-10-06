import { NextResponse } from 'next/server';
import { getLowStockProducts } from '@/server/actions/inventory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || 10);
  const data = await getLowStockProducts(limit);
  return NextResponse.json(data);
}

