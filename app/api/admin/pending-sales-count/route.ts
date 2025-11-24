import { NextResponse } from 'next/server';
import { getPendingSalesCount } from '@/server/actions/sales';

export async function GET() {
  try {
    const count = await getPendingSalesCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

