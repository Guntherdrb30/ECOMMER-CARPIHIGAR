import { NextResponse } from 'next/server';

export async function GET() {
  const host = process.env.NEXT_PUBLIC_URL || 'https://carpihogar.com';
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /auth/',
    `Sitemap: ${host.replace(/\/$/, '')}/sitemap.xml`,
    '',
  ].join('\n');
  return new NextResponse(lines, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

