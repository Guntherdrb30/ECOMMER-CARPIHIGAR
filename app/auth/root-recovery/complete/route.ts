import { NextResponse } from 'next/server';
import { completeRootRecovery } from '@/server/actions/root-recovery';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const res = await completeRootRecovery(form);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 400 });
  }
}

