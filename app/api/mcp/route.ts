import { NextResponse } from 'next/server';
import { listTools, callTool } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const maxDuration = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-API-Key, X-Auth-Token, X-MCP-Token',
};

function getIncomingToken(req: Request): string {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const xApiKey = (req.headers.get('x-api-key') || '').trim();
  const xAuth = (req.headers.get('x-auth-token') || '').trim();
  const xMcp = (req.headers.get('x-mcp-token') || '').trim();
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('token') || url.searchParams.get('access_token') || '').trim();
    return bearer || xApiKey || xAuth || xMcp || q;
  } catch {
    return bearer || xApiKey || xAuth || xMcp;
  }
}

function checkAuth(req: Request): { ok: boolean; error?: string } {
  const token = process.env.MCP_SERVER_TOKEN || '';
  if (!token) return { ok: true }; // allow if not configured
  const given = getIncomingToken(req);
  if (!given || given !== token) return { ok: false, error: 'Unauthorized' };
  return { ok: true };
}

export async function GET(req: Request) {
  const auth = checkAuth(req);
  if (!auth.ok) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (obj: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      // Basic hello with tool registry
      send({ type: 'mcp.ready', server: 'carpihogar-ai-actions', tools: listTools() });
      // Keep-alive pings
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch {}
      }, 15000);
      // Close handler
      (controller as any)._ping = ping;
    },
    cancel() {
      const ping = (this as any)._ping as any;
      if (ping) clearInterval(ping);
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      ...corsHeaders,
    },
  });
}

export async function POST(req: Request) {
  const auth = checkAuth(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || '').toLowerCase();
  if (action === 'list_tools') {
    return NextResponse.json({ ok: true, tools: listTools() }, { headers: corsHeaders });
  }
  if (action === 'call_tool') {
    const name = String(body?.name || '');
    const input = body?.input || {};
    if (!name) return NextResponse.json({ ok: false, error: 'name requerido' }, { status: 400 });
    const res = await callTool(name, input);
    return NextResponse.json({ ok: true, ...res }, { headers: corsHeaders });
  }
  return NextResponse.json({ ok: false, error: 'action invalida' }, { status: 400, headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}
