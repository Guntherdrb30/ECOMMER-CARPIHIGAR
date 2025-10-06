import { NextResponse } from 'next/server';
import { getTopSoldProducts } from '@/server/actions/inventory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get('days') || 30);
  const limit = Number(searchParams.get('limit') || searchParams.get('top') || 10);
  const cat = searchParams.get('cat') || searchParams.get('categoria') || undefined;
  const data = await getTopSoldProducts(days, limit, cat || undefined);
  return NextResponse.json(data);
}

