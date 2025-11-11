import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runPurchaseFlowStep } from '@/server/ai/flows/purchaseFlow';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const step = String(body?.step || '').toLowerCase();
    const input = body?.input || {};
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id as string | undefined;
    const context = { customerId };
    const res = await runPurchaseFlowStep(step, context, input);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ success: false, message: 'No pude procesar tu solicitud de compra. ¿Intentamos nuevamente?' }, { status: 200 });
  }
}
