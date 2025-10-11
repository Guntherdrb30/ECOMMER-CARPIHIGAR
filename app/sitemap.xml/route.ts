import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importar Prisma

function xmlEscape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_URL || 'https://carpihogar.com').replace(/\/$/, '');
  const now = new Date().toISOString();
  
  // 1. URLs estáticas
  const staticUrls = [
    '/',
    '/productos',
    '/categorias',
    '/novedades',
    '/contacto',
  ];

  // 2. URLs dinámicas (código preparado para el futuro)
  // --- DESCOMENTAR CUANDO LA BASE DE DATOS TENGA DATOS ---
  /*
  const products = await prisma.product.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  });

  const productUrls = products.map(p => ({
    url: `/productos/${p.slug}`,
    lastmod: p.updatedAt.toISOString(),
  }));

  const categoryUrls = categories.map(c => ({
    url: `/categorias/${c.slug}`,
    lastmod: c.updatedAt.toISOString(),
  }));
  */
  // --- FIN DEL CÓDIGO PARA DESCOMENTAR ---

  // Por ahora, usamos un array vacío para las URLs dinámicas
  const productUrls: {url: string, lastmod: string}[] = [];
  const categoryUrls: {url: string, lastmod: string}[] = [];

  const allUrls = [
    ...staticUrls.map(u => ({ url: u, lastmod: now, priority: u === '/' ? '1.0' : '0.8' })),
    ...productUrls.map(p => ({ url: p.url, lastmod: p.lastmod, priority: '0.9' })),
    ...categoryUrls.map(c => ({ url: c.url, lastmod: c.lastmod, priority: '0.7' })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    allUrls.map(u => `\n  <url><loc>${xmlEscape(base + u.url)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>daily</changefreq><priority>${u.priority}</priority></url>`).join('') +
    `\n</urlset>`;

  return new NextResponse(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
