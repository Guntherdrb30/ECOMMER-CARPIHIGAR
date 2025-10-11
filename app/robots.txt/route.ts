import { NextResponse } from 'next/server';

export async function GET() {
  const host = process.env.NEXT_PUBLIC_URL || 'https://carpihogar.com';
  const sitemapUrl = `${host.replace(/\/$/, '')}/sitemap.xml`;

  const rules = [
    // Reglas generales para todos los bots
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /auth/',
    '',
    // Permisos explícitos para bots de IA
    'User-agent: GPTBot',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /auth/',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /auth/',
    '',
    'User-agent: Claude-Bot',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /auth/',
    '',
    // Bot de Google para IA generativa
    'User-agent: Google-Extended',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /auth/',
    '',
  ];

  const robotsTxt = [...rules, `Sitemap: ${sitemapUrl}`].join('\n');

  return new NextResponse(robotsTxt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

