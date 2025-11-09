import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || '').trim();
  if (!text) return NextResponse.json({ type: 'text', message: '¿Puedes escribir tu consulta?' });

  // Simulated streaming JSON chunks. Replace with MCP agent streaming.
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: any) => controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + "\n\n"));
      send({ type: 'text', message: `Entendido: ${text}` });
      // Example: show suggested products using public search endpoint on the client
      setTimeout(() => send({ type: 'rich', message: 'Te recomiendo estos productos', products: [] }), 150);
      setTimeout(() => controller.close(), 220);
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

