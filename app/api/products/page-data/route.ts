import { NextResponse } from 'next/server';
import { getProductPageData } from '@/server/actions/products';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = String(searchParams.get('slug') || '').trim();
    if (!slug) {
      return NextResponse.json(
        { product: null, settings: null, relatedProducts: [], error: 'slug requerido' },
        { status: 400 },
      );
    }
    const data = await getProductPageData(slug);
    const status = data.product ? 200 : 404;
    return NextResponse.json(data, { status });
  } catch (e: any) {
    return NextResponse.json(
      {
        product: null,
        settings: null,
        relatedProducts: [],
        error: String(e?.message || e || 'error'),
      },
      { status: 500 },
    );
  }
}

