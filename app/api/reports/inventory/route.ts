import { NextResponse } from 'next/server';
import { getTopSoldProducts, getLeastSoldProducts } from '@/server/actions/inventory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = (searchParams.get('tipo') || 'top').toLowerCase();
  const days = Number(searchParams.get('days') || 30);
  const limit = Number(searchParams.get('limit') || 10);
  const cat = searchParams.get('cat') || undefined;

  const data = tipo === 'low'
    ? await getLeastSoldProducts(days, limit, cat)
    : await getTopSoldProducts(days, limit, cat);

  const lines = [
    ['Producto','SKU','Vendidos'],
    ...data.map((x: any) => [x.product.name, x.product.sku || '', String(x.soldQty)])
  ];
  const csv = lines.map(r => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `${tipo === 'low' ? 'menos' : 'mas'}_vendidos_${days}d_${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    }
  });
}

