import { NextResponse } from 'next/server';
import { getKpis, getTopProducts, getSalesByCategory, getSalesBySeller } from '@/server/actions/reports';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  try {
    const session = await getServerSession(authOptions as any);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  } catch {}

  const [kpis, topProducts, byCategory, bySeller] = await Promise.all([
    getKpis({ from, to }),
    getTopProducts({ from, to }, 10),
    getSalesByCategory({ from, to }, 10),
    getSalesBySeller({ from, to }),
  ]);

  const PDFDocument = (await import('pdfkit/js/pdfkit.standalone.js')).default as any;
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const chunks: Buffer[] = [];
  (doc as any).on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
  const done = new Promise<Buffer>((resolve) => (doc as any).on('end', () => resolve(Buffer.concat(chunks))));

  const rangeText = (from || to) ? `Rango: ${from || 'inicio'} — ${to || 'hoy'}` : 'Rango: últimos 30 días';

  doc.fontSize(16).text('Reporte Analítico - Carpihogar.ai');
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor('#555').text(rangeText);
  doc.moveDown(0.75);
  doc.fillColor('black');

  // KPIs
  doc.fontSize(12).text('KPIs');
  doc.moveDown(0.5);
  doc.fontSize(10);
  const kpiLines = [
    `Ingresos: $${kpis.totalRevenueUSD.toFixed(2)}`,
    `Órdenes: ${kpis.ordersCount}`,
    `Ticket Promedio: $${kpis.avgOrderValueUSD.toFixed(2)}`,
    `Órdenes Pagadas: ${kpis.paidOrders}`,
    `Ventas a Crédito: ${kpis.creditOrders}`,
  ];
  kpiLines.forEach(l => doc.text(l));

  // Top productos
  doc.moveDown(0.75);
  doc.fontSize(12).text('Top Productos (USD)');
  doc.moveDown(0.25);
  doc.fontSize(10);
  if (topProducts.length === 0) {
    doc.text('Sin datos');
  } else {
    for (const p of topProducts) {
      doc.text(`${p.name} ${p.sku ? '('+p.sku+')' : ''} - Cant: ${p.qty} - USD: $${Number(p.revenueUSD || 0).toFixed(2)}`);
    }
  }

  // Categorías
  doc.moveDown(0.75);
  doc.fontSize(12).text('Ventas por Categoría (USD)');
  doc.moveDown(0.25);
  doc.fontSize(10);
  if (byCategory.length === 0) {
    doc.text('Sin datos');
  } else {
    for (const c of byCategory) {
      doc.text(`${c.category} - USD: $${Number(c.revenueUSD || 0).toFixed(2)} - Cant: ${c.qty}`);
    }
  }

  // Vendedores
  doc.moveDown(0.75);
  doc.fontSize(12).text('Ventas por Vendedor (USD)');
  doc.moveDown(0.25);
  doc.fontSize(10);
  if (bySeller.length === 0) {
    doc.text('Sin datos');
  } else {
    for (const s of bySeller) {
      doc.text(`${s.seller} - Órdenes: ${s.orders} - USD: $${Number(s.revenueUSD || 0).toFixed(2)}`);
    }
  }

  (doc as any).end();
  const pdf = await done;
  const filename = `reporte_analitico_${Date.now()}.pdf`;
  return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=${filename}` } });
}
