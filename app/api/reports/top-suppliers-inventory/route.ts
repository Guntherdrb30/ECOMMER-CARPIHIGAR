import { NextResponse } from 'next/server';
import { getTopSuppliersByInventory } from '@/server/actions/inventory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria') || undefined;
  const q = searchParams.get('q') || undefined;
  const limit = Number(searchParams.get('limit') || 5);

  const data = await getTopSuppliersByInventory({ categorySlug: categoria, q: q || undefined, limit });
  const lines = [
    ['Proveedor','TotalUSD'],
    ...data.rows.map((r) => [r.supplier, r.totalValueUSD.toFixed(2)]),
    [],
    ['TOTAL INVENTARIO', data.totalValueUSD.toFixed(2)]
  ];
  const csv = lines.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `top_proveedores_inventario_${Date.now()}.csv`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${filename}` } });
}

