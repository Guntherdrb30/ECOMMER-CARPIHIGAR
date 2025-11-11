import { NextResponse } from 'next/server';
import { listTools } from '@/lib/mcp/tools';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
};

export async function GET() {
  const spec = {
    server: 'carpihogar-ai-actions',
    transport: ['sse', 'http'],
    sse: { url: `${process.env.NEXT_PUBLIC_URL || ''}/api/mcp` },
    http: {
      listTools: { method: 'POST', url: `${process.env.NEXT_PUBLIC_URL || ''}/api/mcp`, body: { action: 'list_tools' } },
      callTool: { method: 'POST', url: `${process.env.NEXT_PUBLIC_URL || ''}/api/mcp` },
    },
    auth: { type: process.env.MCP_SERVER_TOKEN ? 'bearer' : 'none' },
    tools: listTools(),
  };
  return NextResponse.json(spec, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}
