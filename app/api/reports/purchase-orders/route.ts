import { NextResponse } from 'next/server';
import { getPOs } from '@/server/actions/procurement';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const supplierId = searchParams.get('supplierId') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const status = searchParams.get('status') || undefined;

  const pos = await getPOs({ q, supplierId, from, to, status: status as any });

  const lines = [
    ['OC','Proveedor','Estado','TotalUSD','Fecha','Esperada','Notas'],
    ...pos.map((po: any) => [
      po.id,
      po.supplier?.name || '',
      po.status,
      String(Number(po.totalUSD).toFixed(2)),
      new Date(po.createdAt).toISOString(),
      po.expectedAt ? new Date(po.expectedAt).toISOString() : '',
      po.notes || ''
    ])
  ];
  const csv = lines.map(r => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `ordenes_compra_${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    }
  });
}
