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
    async start(controller) {
      const chunk = (obj: any) => controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + "\n\n"));
      for await (const c of processIncomingAudio({ audioBase64: base64, customerId })) chunk(c);
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
