import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const channel = searchParams.get('channel') || undefined;

  const where: any = {};
  if (status) where.status = status as any;
  if (channel) where.channel = channel as any;

  const shipments = await prisma.shipping.findMany({
    where,
    include: { order: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const lines = [
    ['Orden','Cliente','Email','Canal','Carrier','Tracking','Estado','Observaciones','Creado','Actualizado'],
    ...shipments.map((s: any) => [
      s.orderId,
      s.order?.user?.name || '',
      s.order?.user?.email || '',
      s.channel || '',
      s.carrier || '',
      s.tracking || '',
      s.status || '',
      (s.observations || '').replace(/\n/g,' '),
      new Date(s.createdAt).toISOString(),
      new Date(s.updatedAt).toISOString(),
    ])
  ];
  const csv = lines.map(r => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `envios_${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${filename}`,
    }
  });
}

