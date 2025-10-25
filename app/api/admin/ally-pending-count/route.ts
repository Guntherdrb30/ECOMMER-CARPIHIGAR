import { NextResponse } from 'next/server';
import { getAllyPendingSalesCount } from '@/server/actions/ally-admin';

export async function GET() {
  try {
    const count = await getAllyPendingSalesCount();
    return NextResponse.json({ count });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

