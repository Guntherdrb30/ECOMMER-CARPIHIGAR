import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { sendMessage } from '@/server/assistant/agent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || '').trim();
  if (!text) return NextResponse.json({ type: 'text', message: '¿Puedes escribir tu consulta?' });

  const session = await getServerSession(authOptions);
  const customerId = (session?.user as any)?.id as string | undefined;
  const stream = new ReadableStream({
    async start(controller) {
      const chunk = (obj: any) => controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + "\n\n"));
      for await (const c of sendMessage({ text, customerId })) chunk(c);
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
