import { NextResponse } from 'next/server';
import { getInventoryValuation } from '@/server/actions/inventory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria') || undefined;
  const proveedor = searchParams.get('proveedor') || undefined;
  const q = searchParams.get('q') || undefined;

  const data = await getInventoryValuation({ categorySlug: categoria, supplierId: proveedor, q: q || undefined });
  const lines = [
    ['Producto','SKU','Proveedor','Categoría','Stock','CostoUSD','TotalUSD'],
    ...data.rows.map((r) => [r.name, r.sku, r.supplier, r.category, String(r.stock), r.unitCostUSD.toFixed(2), r.totalValueUSD.toFixed(2)]),
    [],
    ['TOTAL', '', '', '', '', '', data.totalValueUSD.toFixed(2)]
  ];
  const csv = lines.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `valuacion_inventario_${Date.now()}.csv`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${filename}` } });
}

