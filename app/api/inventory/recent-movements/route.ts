import { NextResponse } from 'next/server';
import { getRecentStockMovements } from '@/server/actions/inventory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const take = Number(searchParams.get('take') || 15);
  const moves = await getRecentStockMovements(take);
  return NextResponse.json(moves);
}

