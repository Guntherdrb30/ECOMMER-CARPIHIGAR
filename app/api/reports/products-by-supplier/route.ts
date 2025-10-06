import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get('supplierId') || searchParams.get('proveedor') || undefined;
  const categoria = searchParams.get('categoria') || undefined;
  const q = searchParams.get('q') || undefined;

  const where: any = {};
  if (supplierId) where.supplierId = supplierId;
  if (categoria) where.categoryId = categoria;
  if (q) where.OR = [ { name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } } ];

  const items = await prisma.product.findMany({ where, include: { category: true, supplier: true }, orderBy: { name: 'asc' } });

  const lines = [
    ['Proveedor','Producto','SKU','Categoría','PrecioUSD','Stock'],
    ...items.map((p) => [p.supplier?.name || '', p.name, p.sku || '', (p as any).category?.name || '', p.priceUSD.toString(), String(p.stock)])
  ];
  const csv = lines.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `productos_por_proveedor_${supplierId || 'todos'}_${Date.now()}.csv`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${filename}` } });
}
