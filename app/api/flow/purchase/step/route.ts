import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runPurchaseFlowStep } from '@/server/ai/flows/purchaseFlow';
import crypto from 'crypto';

const ASSISTANT_SESSION_COOKIE = 'assistant_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getOrCreateAssistantSession(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${ASSISTANT_SESSION_COOKIE}=([^;]+)`));
  if (match) {
    return { sessionId: decodeURIComponent(match[1]), setCookieHeader: null as string | null };
  }
  const sessionId = crypto.randomUUID();
  const setCookieHeader = `${ASSISTANT_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax; HttpOnly`;
  return { sessionId, setCookieHeader };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const step = String(body?.step || '').toLowerCase();
    const input = body?.input || {};
    const { sessionId, setCookieHeader } = getOrCreateAssistantSession(req);
    const session = await getServerSession(authOptions);
    const customerId = (session?.user as any)?.id as string | undefined;
    const context = { customerId, sessionId };
    const flowRes = await runPurchaseFlowStep(step, context, input);
    const res = NextResponse.json(flowRes);
    if (setCookieHeader) res.headers.append('Set-Cookie', setCookieHeader);
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ success: false, message: 'No pude procesar tu solicitud de compra. �Intentamos nuevamente?' }, { status: 200 });
    return res;
  }
}

