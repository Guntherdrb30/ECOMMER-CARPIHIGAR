import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const orderId = params.orderId;
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId: (session.user as any)?.id },
          // allow admin
          // will be checked by fetching regardless; a mismatch will be filtered below
        ],
      } as any,
      include: { user: true, shipping: true, shippingAddress: true, items: true },
    });

    // If not owner, allow ADMIN to see
    if (!order) {
      if ((session.user as any)?.role !== 'ADMIN') {
        return new NextResponse('Not Found', { status: 404 });
      }
    }
    const effectiveOrder = order || (await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, shipping: true, shippingAddress: true, items: true } }));
    if (!effectiveOrder) return new NextResponse('Not Found', { status: 404 });

    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const logoBuf = await fetchLogoBuffer((settings as any)?.logoUrl);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: any[] = [];
    doc.on('data', (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Header
    if (logoBuf) {
      try { doc.image(logoBuf, 40, 30, { height: 40 }); } catch {}
    }
    doc.fontSize(18).text(String(settings?.brandName || 'Carpihogar.ai'), logoBuf ? 90 : 40, 35);
    doc.fontSize(10).fillColor('#666').text(`Envío del pedido ${effectiveOrder.id}`, { align: 'right' });
    doc.moveDown();
    doc.moveTo(40, 80).lineTo(555, 80).strokeColor('#ddd').stroke();

    // Shipping info
    const s = effectiveOrder.shipping as any;
    const addr = effectiveOrder.shippingAddress as any;
    const user = effectiveOrder.user as any;
    doc.fillColor('#111').fontSize(12).text('Datos del envío', 40, 95, { continued: false });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333');
    doc.text(`Cliente: ${user?.name || '-'} (${user?.email || ''})`);
    doc.text(`Teléfono: ${user?.phone || '-'}`);
    doc.text(`Transportista: ${s?.carrier || '-'}`);
    doc.text(`Tracking: ${s?.tracking || '-'}`);
    doc.text(`Estado: ${s?.status || 'PENDIENTE'}`);
    doc.moveDown(0.5);
    doc.text('Dirección de envío:');
    doc.text(`${addr?.fullname || ''}`);
    doc.text(`${addr?.address1 || ''}${addr?.address2 ? ', ' + addr.address2 : ''}`);
    doc.text(`${addr?.zone ? addr.zone + ', ' : ''}${addr?.city || ''}, ${addr?.state || ''}`);
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
    for (const it of (effectiveOrder.items as any[])) {
      const p = Number(it.priceUSD || 0);
      const q = Number(it.quantity || 0);
      const sub = p * q;
      subtotal += sub;
      const cols = [it.name, `$ ${p.toFixed(2)}`, String(q), `$ ${sub.toFixed(2)}`];
      cols.forEach((c, i) => {
        doc.fillColor('#111').text(c, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, { width: colWidths[i] });
      });
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);
    const ivaPercent = Number(effectiveOrder.ivaPercent || settings?.ivaPercent || 16);
    const iva = subtotal * (ivaPercent / 100);
    const total = subtotal + iva;
    doc.text(`IVA (${ivaPercent}%): $ ${iva.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total: $ ${total.toFixed(2)}`, { align: 'right' }).font('Helvetica');

    // Shipping label page with QR
    doc.addPage({ size: 'A4', margin: 36 });
    const brandName = String(settings?.brandName || 'Carpihogar.ai');
    const s2 = effectiveOrder.shipping as any;
    const addr2 = effectiveOrder.shippingAddress as any;
    const trackUrl = (() => {
      const carrier = String(s2?.carrier || '').toUpperCase();
      const code = String(s2?.tracking || '').trim();
      if (carrier && code) {
        if (carrier === 'TEALCA') return `https://www.tealca.com/servicios/rastreo/?guia=${encodeURIComponent(code)}`;
        if (carrier === 'MRW') return `https://www.mrw.com.ve/rastreo?guia=${encodeURIComponent(code)}`;
        return `https://www.google.com/search?q=${encodeURIComponent(`${carrier} ${code}`)}`;
      }
      const base = process.env.NEXT_PUBLIC_URL || '';
      return `${base}/dashboard/cliente/pedidos/${effectiveOrder.id}`;
    })();

    if (logoBuf) {
      try { doc.image(logoBuf, 36, 32, { height: 48 }); } catch {}
    }
    doc.fontSize(22).fillColor('#111').text(brandName, logoBuf ? 96 : 36, 36);
    doc.fontSize(12).fillColor('#444').text(`Etiqueta de envío • Pedido ${effectiveOrder.id.slice(0,8)}`, { align: 'right' });
    doc.moveTo(36, 90).lineTo(559, 90).strokeColor('#ddd').stroke();

    // Big address block
    doc.fontSize(14).fillColor('#111').text('Destinatario', 36, 102);
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#000').text(`${addr2?.fullname || '-'}`);
    doc.fontSize(12).fillColor('#333').text(`${addr2?.address1 || ''}${addr2?.address2 ? ', ' + addr2.address2 : ''}`);
    doc.text(`${addr2?.zone ? addr2.zone + ', ' : ''}${addr2?.city || ''}, ${addr2?.state || ''}`);
    doc.moveDown(0.5);
    doc.fillColor('#111').text('Transportista / Tracking');
    doc.fillColor('#333').text(`${s2?.carrier || '-'}  ${s2?.tracking ? `• ${s2.tracking}` : ''}`);

    // QR code
    try {
      const QRCode = (await import('qrcode')).default as any;
      const qrBuf: Buffer = await QRCode.toBuffer(trackUrl, { width: 256, margin: 1 });
      doc.image(qrBuf, 360, 120, { width: 180 });
      doc.fontSize(10).fillColor('#444').text('Escanea para rastrear', 360, 310, { width: 180, align: 'center' });
    } catch {}

    doc.end();
    const pdfBuf = await done;
    const resp = new NextResponse(pdfBuf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="envio_${effectiveOrder.id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
    return resp;
  } catch (e) {
    return new NextResponse(`Error: ${String(e)}`, { status: 500 });
  }
}
