import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const headers = [
      'name','code','sku','barcode','brand','description','category','supplierId','stock','costUSD','priceUSD','priceAllyUSD','priceWholesaleUSD','images'
    ];
    const rows: string[] = [];
    rows.push(headers.join(','));
    for (const p of products) {
      const vals = [
        p.name,
        p.code || '',
        p.sku || '',
        p.barcode || '',
        p.brand || '',
        p.description || '',
        p.category?.slug || '',
        p.supplierId || '',
        String(p.stock ?? 0),
        (p.costUSD as any)?.toString?.() || '',
        (p.priceUSD as any)?.toString?.() || '',
        (p.priceAllyUSD as any)?.toString?.() || '',
        (p.priceWholesaleUSD as any)?.toString?.() || '',
        (Array.isArray(p.images) ? p.images.join('|') : ''),
      ].map((v) => {
        const s = String(v ?? '');
        return /[,\n\r"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      });
      rows.push(vals.join(','));
    }
    const csv = rows.join('\r\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="products_export.csv"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

