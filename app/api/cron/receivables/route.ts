import { NextResponse } from 'next/server';
import { runReceivablesReminderJob } from '@/server/actions/receivables';

export async function GET() {
  try {
    const res = await runReceivablesReminderJob();
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
