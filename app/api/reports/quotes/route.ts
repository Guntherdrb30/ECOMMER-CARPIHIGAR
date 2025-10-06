import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const status = searchParams.get('status') || undefined;
  const sellerId = searchParams.get('sellerId') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  const where: any = {};
  if (status) where.status = status as any;
  if (sellerId) where.sellerId = sellerId;
  if (from || to) {
    const createdAt: any = {};
    if (from) { const d = new Date(String(from)); if (!isNaN(d.getTime())) createdAt.gte = d as any; }
    if (to) { const d = new Date(String(to)); if (!isNaN(d.getTime())) { const next = new Date(d); next.setDate(next.getDate()+1); createdAt.lt = next as any; } }
    if (Object.keys(createdAt).length) where.createdAt = createdAt;
  }
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const quotes = await prisma.quote.findMany({ where, include: { user: true, seller: true }, orderBy: { createdAt: 'desc' } });

  const lines = [
    ['ID','Cliente','Email','Vendedor','Estado','SubtotalUSD','IVA%','TotalUSD','Fecha','Vence','Notas'],
    ...quotes.map((r: any) => [
      r.id,
      r.user?.name || '',
      r.user?.email || '',
      r.seller?.name || r.seller?.email || '',
      r.status,
      String(Number(r.subtotalUSD).toFixed(2)),
      String(Number(r.ivaPercent).toFixed(2)),
      String(Number(r.totalUSD).toFixed(2)),
      new Date(r.createdAt).toISOString(),
      r.expiresAt ? new Date(r.expiresAt).toISOString() : '',
      (r.notes || '').replace(/\n/g,' '),
    ])
  ];

  const csv = lines.map(r => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `presupuestos_${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    }
  });
}

