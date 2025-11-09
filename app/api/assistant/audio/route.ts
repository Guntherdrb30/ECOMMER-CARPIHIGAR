import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const base64 = String(body?.audioBase64 || '');
  if (!base64) return NextResponse.json({ type: 'text', message: 'No recibí audio.' });

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: any) => controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + "\n\n"));
      // In real integration, transcribe audio -> text -> sendMessage to MCP
      send({ type: 'text', message: 'Procesé tu audio. Estoy buscando opciones…' });
      setTimeout(() => send({ type: 'voice', audioBase64: base64 }), 120);
      setTimeout(() => controller.close(), 200);
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

