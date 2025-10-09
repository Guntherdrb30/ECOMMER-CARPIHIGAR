import { NextResponse } from 'next/server';
import { getSalesByCategory } from '@/server/actions/reports';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const limit = Number(searchParams.get('limit') || 20);
  try {
    const session = await getServerSession(authOptions as any);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } catch {}
  const data = await getSalesByCategory({ from, to }, limit);
  const lines = [ ['Categoria','Cantidad','IngresosUSD'], ...data.map((c: any) => [c.category, c.qty, c.revenueUSD.toFixed(2)]) ];
  const csv = lines.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `ventas_categoria_${Date.now()}.csv`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${filename}` } });
}

