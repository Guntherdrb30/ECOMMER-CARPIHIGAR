import { NextResponse } from 'next/server';
import { getSalesSeries } from '@/server/actions/reports';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  try {
    const session = await getServerSession(authOptions as any);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } catch {}
  const data = await getSalesSeries({ from, to });
  const lines = [ ['Fecha','IngresosUSD','Ordenes'], ...data.map((d: any) => [d.date, d.revenueUSD, d.orders]) ];
  const csv = lines.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `ventas_series_${Date.now()}.csv`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${filename}` } });
}

