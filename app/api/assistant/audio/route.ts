import { NextResponse } from 'next/server';
import { processIncomingAudio } from '@/server/assistant/agent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const base64 = String(body?.audioBase64 || '');
  if (!base64) return NextResponse.json({ type: 'text', message: 'No recibí audio.' });

  const session = await getServerSession(authOptions);
  const customerId = (session?.user as any)?.id as string | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const chunk = (obj: any) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n\n'));

      (async () => {
        try {
          for await (const c of processIncomingAudio({ audioBase64: base64, customerId })) {
            chunk(c);
          }
        } finally {
          try {
            controller.close();
          } catch {}
        }
      })();
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

