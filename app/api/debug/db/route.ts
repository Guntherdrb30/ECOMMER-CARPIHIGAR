import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'VENDEDOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [products, settings] = await Promise.all([
      prisma.product.count(),
      prisma.siteSettings.count(),
    ]);
    return NextResponse.json({ ok: true, products, siteSettings: settings });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

