import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PDFDocument from 'pdfkit';

// Ensure Node.js runtime for pdfkit on Vercel/Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const fs = await import('fs');
    const path = await import('path');
    const p = path.join(process.cwd(), 'public', trimmed);
    if (fs.existsSync(p)) {
      return fs.readFileSync(p);
    }
  } catch {}
  return null;
}

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const url = new URL(req.url);
    const tipoRaw = (url.searchParams.get('tipo') || 'recibo').toLowerCase();
    const monedaRaw = (url.searchParams.get('moneda') || 'USD').toUpperCase();
    const login = new URL('/auth/login', url.origin);
    const callbackUrl = new URL(`/api/orders/${params.orderId}/pdf`, url.origin);
    callbackUrl.searchParams.set('tipo', tipoRaw);
    callbackUrl.searchParams.set('moneda', monedaRaw);
    login.searchParams.set('callbackUrl', callbackUrl.toString());
    return NextResponse.redirect(login);
  }
  const url = new URL(req.url);
  const tipoRaw = (url.searchParams.get('tipo') || 'recibo').toLowerCase();
  const monedaRaw = (url.searchParams.get('moneda') || 'USD').toUpperCase();
  const allowedDocs = ['recibo', 'nota', 'factura'];
  const tipo = (allowedDocs.includes(tipoRaw) ? tipoRaw : 'recibo') as 'recibo'|'nota'|'factura';
  const moneda = (['USD','VES'].includes(monedaRaw) ? monedaRaw : 'USD') as 'USD'|'VES';

  const orderId = params.orderId;
  try {
    // Allow: owner (userId), seller (sellerId), ADMIN/VENDEDOR/ALIADO (checked after fetch)
    const userId = (session.user as any)?.id;
    const role = (session.user as any)?.role;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, seller: true, items: true, payment: true } });
    if (!order) return new NextResponse('Not Found', { status: 404 });
    const isOwner = order.userId === userId;
    const isSeller = String(order.sellerId || '') === String(userId || '');
    const isAdminLike = ['ADMIN','VENDEDOR','ALIADO'].includes(String(role || ''));
    if (!(isOwner || isSeller || isAdminLike)) return new NextResponse('Forbidden', { status: 403 });

    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const logoBuf = await fetchLogoBuffer((settings as any)?.logoUrl);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Uint8Array[] = [];
    doc.on('data', (c: any) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));
    });

    const ivaPercent = Number(order.ivaPercent || (settings as any)?.ivaPercent || 16);
    const tasaVES = Number(order.tasaVES || (settings as any)?.tasaVES || 40);
    const titleMap: any = { recibo: 'Recibo', nota: 'Nota de Entrega', factura: 'Factura' };
    const title = titleMap[tipo] || 'Comprobante';
    const toMoney = (v: number) => (moneda === 'VES' ? v * tasaVES : v);
    const money = (v: number) => (moneda === 'VES' ? `Bs ${v.toFixed(2)}` : `$ ${v.toFixed(2)}`);

    // Header
    if (logoBuf) {
      try { doc.image(logoBuf, 40, 30, { height: 40 }); } catch {}
    }
    doc.fontSize(18).text(String(settings?.brandName || 'Carpihogar.ai'), logoBuf ? 90 : 40, 35);
    doc.fontSize(10).fillColor('#666').text(`${title} - ${order.id}`, { align: 'right' });
    doc.moveDown();
    doc.moveTo(40, 80).lineTo(555, 80).strokeColor('#ddd').stroke();

    // Order info
    const user = order.user as any;
    doc.fillColor('#111').fontSize(12).text('Datos de la venta', 40, 95);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333');
    doc.text(`Cliente: ${user?.name || user?.email || '-'}`);
    if (tipo === 'factura') {
      if (order.customerTaxId) doc.text(`Cedula/RIF: ${order.customerTaxId}`);
      if (order.customerFiscalAddress) doc.text(`Dirección fiscal: ${order.customerFiscalAddress}`);
    } else if (order.payment) {
      doc.text(`Pago: ${(order.payment as any)?.method || '-'} - ${(order.payment as any)?.currency || 'USD'}${(order.payment as any)?.reference ? ` - Ref: ${(order.payment as any)?.reference}` : ''}`);
    }
    doc.text(`Fecha: ${new Date(order.createdAt as any).toLocaleString()}`);
    doc.text(`Moneda: ${moneda}`);
    doc.text(`IVA: ${ivaPercent}%${moneda === 'VES' ? ` - Tasa: ${tasaVES}` : ''}`);
    doc.moveDown();

    // Items table
    doc.fontSize(12).fillColor('#111').text('Productos');
    doc.moveDown(0.5);
    const startX = 40;
    const colWidths = [310, 70, 70, 70];
    const headers = ['Producto', 'Precio', 'Cant.', 'Subtotal'];
    doc.fontSize(10).fillColor('#333');
    headers.forEach((h, i) => {
      doc.text(h, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, { width: colWidths[i] });
    });
    doc.moveDown(0.3);
    doc.moveTo(startX, doc.y).lineTo(555, doc.y).strokeColor('#eee').stroke();
    let subtotal = 0;
    for (const it of (order.items as any[])) {
      const p = Number((it as any).priceUSD || 0);
      const q = Number((it as any).quantity || 0);
      const sub = p * q;
      subtotal += sub;
      const cols = [ (it as any).name || (it as any).product?.name || 'Producto', money(toMoney(p)), String(q), money(toMoney(sub)) ];
      cols.forEach((c, i) => {
        doc.fillColor('#111').text(c, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, { width: colWidths[i] });
      });
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);
    const iva = subtotal * (ivaPercent / 100);
    const total = subtotal + iva;
    doc.text(`Subtotal: ${money(toMoney(subtotal))}`, { align: 'right' });
    doc.text(`IVA (${ivaPercent}%): ${money(toMoney(iva))}`, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total: ${money(toMoney(total))}`, { align: 'right' }).font('Helvetica');

    doc.end();
    const pdfBuf = await done;
    const fname = `${tipo}_${order.id}.pdf`;
    const resp = new NextResponse(new Uint8Array(pdfBuf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fname}"`,
        'Cache-Control': 'no-store',
      },
    });
    return resp;
  } catch (e) {
    console.error('[orders/pdf] Error generating PDF:', e);
    return new NextResponse(`Error: ${String(e)}`, { status: 500 });
  }
}
