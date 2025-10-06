import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

async function fetchLogoBuffer(logoUrl?: string): Promise<Buffer | null> {
  try {
    if (!logoUrl) return null;
    if (logoUrl.startsWith('http')) {
      const res = await fetch(logoUrl);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    }
    const trimmed = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
    const filePath = path.join(process.cwd(), 'public', trimmed);
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

async function generatePdf(order: any): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default as any;
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const chunks: Buffer[] = [];
  const stream = doc as any;
  stream.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
  const done = new Promise<Buffer>((resolve) => stream.on('end', () => resolve(Buffer.concat(chunks))));

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const logoBuf = await fetchLogoBuffer((settings as any)?.logoUrl);
  if (logoBuf) {
    try { doc.image(logoBuf, 36, 24, { fit: [160, 60] }); } catch {}
  }

  const totalUSD = Number(order.totalUSD || 0);
  const entries = order.receivable?.entries || [];
  const abonadoUSD = entries.reduce((a: number, e: any) => a + Number(e.amountUSD || 0), 0);
  const saldoUSD = Math.max(0, totalUSD - abonadoUSD);
  const vence = (order.receivable?.dueDate || (order as any).creditDueDate || null) as Date | null;

  if (!logoBuf) doc.moveDown(0.5);
  doc.moveDown(0.5);
  doc.fontSize(16).text(`Estado de Cuenta - Orden ${order.id}`);
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Fecha: ${new Date(order.createdAt as any).toLocaleString()}`);
  doc.text(`Cliente: ${order.user?.name || order.user?.email || ''}`);
  doc.text(`Email: ${order.user?.email || ''}`);
  doc.text(`Teléfono: ${String((order.user as any)?.phone || '')}`);
  doc.text(`Vendedor: ${order.seller?.name || order.seller?.email || ''}`);
  if (vence) doc.text(`Vence: ${new Date(vence as any).toLocaleDateString()}`);
  doc.moveDown(0.5);
  doc.text(`Total USD: $${totalUSD.toFixed(2)}`);
  doc.text(`Abonado USD: $${abonadoUSD.toFixed(2)}`);
  doc.text(`Saldo USD: $${saldoUSD.toFixed(2)}`);
  if (order.receivable?.notes) { doc.moveDown(0.5).text(`Observaciones: ${order.receivable?.notes}`); }

  doc.moveDown(1);
  doc.fontSize(13).text('Detalle de abonos');
  doc.moveDown(0.5);
  doc.fontSize(11);
  if (!entries.length) {
    doc.text('Sin abonos registrados');
  } else {
    for (const e of entries) {
      const d = new Date((e as any).createdAt as any).toLocaleDateString();
      const line = `${d}  $${Number((e as any).amountUSD).toFixed(2)}  ${(e as any).currency || ''}  ${(e as any).method || ''}  Ref: ${(e as any).reference || ''}`;
      doc.text(line);
      if ((e as any).notes) doc.text(`Notas: ${(e as any).notes}`);
    }
  }

  doc.end();
  return done;
}

export async function GET(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      seller: { select: { name: true, email: true } },
      receivable: { include: { entries: { orderBy: { createdAt: 'asc' } } } },
    },
  });
  if (!order) return new NextResponse('Not found', { status: 404 });

  try {
    const pdf = await generatePdf(order);
    const filename = `cxc_${order.id}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=${filename}`,
      }
    });
  } catch (e) {
    return new NextResponse('PDF error', { status: 500 });
  }
}
