import { NextResponse } from 'next/server';

function xmlEscape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_URL || 'https://carpihogar.com').replace(/\/$/, '');
  const now = new Date().toISOString();
  const urls = [
    '/',
    '/productos',
    '/categorias',
    '/novedades',
    '/contacto',
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map((u) => `\n  <url><loc>${xmlEscape(base + u)}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>${u==='/'?'1.0':'0.8'}</priority></url>`).join('') +
    `\n</urlset>`;

  return new NextResponse(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

