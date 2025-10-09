import { NextResponse } from 'next/server';
import { getReceivablesAging } from '@/server/actions/reports';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } catch {}
  const data = await getReceivablesAging();
  const lines = [ ['Bucket','Cuentas','TotalUSD'], ...data.map((r: any) => [r.bucket, r.count, r.totalUSD.toFixed(2)]) ];
  const csv = lines.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const filename = `cxc_aging_${Date.now()}.csv`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${filename}` } });
}

