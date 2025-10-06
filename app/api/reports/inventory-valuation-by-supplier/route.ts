import { NextResponse } from 'next/server';
import { getInventoryValuationBySupplier } from '@/server/actions/inventory';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria') || undefined;
  const proveedor = searchParams.get('proveedor') || undefined;
  const q = searchParams.get('q') || undefined;

  const data = await getInventoryValuationBySupplier({ categorySlug: categoria, supplierId: proveedor, q: q || undefined });
  const lines: string[][] = [];
  lines.push(['Proveedor','Producto','SKU','Categoría','Stock','CostoUSD','TotalUSD']);
  for (const g of data.groups) {
    lines.push([g.supplier, '', '', '', '', '', '']);
    for (const r of g.rows) {
      lines.push(['', r.name, r.sku, r.category, String(r.stock), r.unitCostUSD.toFixed(2), r.totalValueUSD.toFixed(2)]);
    }
    lines.push(['Subtotal', '', '', '', '', '', g.subtotalUSD.toFixed(2)]);
    lines.push([]);
  }
  lines.push(['TOTAL', '', '', '', '', '', data.totalValueUSD.toFixed(2)]);

  const csv = lines.map(r => r.map(v => v === undefined ? '' : `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `valuacion_por_proveedor_${Date.now()}.csv`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${filename}` } });
}

