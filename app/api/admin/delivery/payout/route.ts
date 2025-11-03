import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { put } from '@vercel/blob';
import PDFDocument from 'pdfkit';

function startOfDay(d: Date) { const x=new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x=new Date(d); x.setHours(23,59,59,999); return x; }

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let deliveryUserId = '' as string;
  let from = '' as string;
  let to = '' as string;
  let paymentMethod = '' as string;
  let paymentReference = '' as string;
  let paymentDate = '' as string; // ISO or yyyy-mm-dd
  let paymentNotes = '' as string;
  let proofUrl: string | null = null;

  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({} as any));
    deliveryUserId = String(body?.deliveryUserId || '');
    from = String(body?.from || '');
    to = String(body?.to || '');
    paymentMethod = String(body?.paymentMethod || '');
    paymentReference = String(body?.paymentReference || '');
    paymentDate = String(body?.paymentDate || '');
    paymentNotes = String(body?.paymentNotes || '');
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      deliveryUserId = String(fd.get('deliveryUserId') || '');
      from = String(fd.get('from') || '');
      to = String(fd.get('to') || '');
      paymentMethod = String(fd.get('paymentMethod') || '');
      paymentReference = String(fd.get('paymentReference') || '');
      paymentDate = String(fd.get('paymentDate') || '');
      paymentNotes = String(fd.get('paymentNotes') || '');
      const proof = fd.get('proof');
      if (proof && typeof proof === 'object' && 'arrayBuffer' in proof) {
        const file = proof as File;
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const cleanFrom = from.replace(/[^0-9-]/g, '');
        const cleanTo = to.replace(/[^0-9-]/g, '');
        const ext = (file.name || 'proof.pdf').split('.').pop() || 'pdf';
        const path = `payouts/delivery/${deliveryUserId}/${cleanFrom}_${cleanTo}/proof_${Date.now()}.${ext}`;
        const uploaded = await put(path, bytes, { access: 'public', contentType: file.type || 'application/octet-stream' });
        proofUrl = uploaded.url;
      }
    }
  }

  if (!deliveryUserId || !from || !to) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const fromDate = startOfDay(new Date(from));
  const toDate = endOfDay(new Date(to));

  const orders = await prisma.order.findMany({
    where: {
      shipping: { carrier: 'DELIVERY' as any, assignedToId: deliveryUserId, status: 'ENTREGADO' as any },
      shippingAddress: { is: { city: { equals: 'Barinas', mode: 'insensitive' } } as any },
      updatedAt: { gte: fromDate, lte: toDate },
    },
    include: { user: { select: { name: true, email: true } }, shipping: true },
    orderBy: { updatedAt: 'asc' },
  });

  // Only consider pending (unpaid) deliveries
  const pending = orders.filter(o => !o.shipping?.deliveryPaidAt);
  const orderIds = pending.map(o => o.id);
  const total = pending.reduce((acc, o) => acc + parseFloat(String(o.shipping?.deliveryFeeUSD || 0)), 0);

  // Create PDF payout file
  const user = await prisma.user.findUnique({ where: { id: deliveryUserId }, select: { name: true, email: true } });
  const pdfDoc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  pdfDoc.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
  const pdfReady = new Promise<Buffer>((resolve) => pdfDoc.on('end', () => resolve(Buffer.concat(chunks))));

  const header = () => {
    pdfDoc.fontSize(18).text('Pago a Delivery', { align: 'left' });
    pdfDoc.moveDown(0.5);
    pdfDoc.fontSize(11).text(`Delivery: ${user?.name || user?.email || deliveryUserId}`);
    if (user?.email) pdfDoc.text(`Email: ${user.email}`);
    pdfDoc.text(`Periodo: ${from} a ${to}`);
    pdfDoc.text(`Método: ${paymentMethod || '-'}   Referencia: ${paymentReference || '-'}`);
    pdfDoc.text(`Fecha de pago: ${paymentDate || '-'}`);
    if (paymentNotes) pdfDoc.text(`Notas: ${paymentNotes}`);
    pdfDoc.moveDown(0.75);
    pdfDoc.moveTo(50, pdfDoc.y).lineTo(545, pdfDoc.y).strokeColor('#dddddd').stroke();
    pdfDoc.moveDown(0.5);
  };

  const tableHeader = () => {
    pdfDoc.font('Helvetica-Bold').fontSize(11);
    const y = pdfDoc.y;
    pdfDoc.text('Fecha', 50, y);
    pdfDoc.text('Orden', 160, y);
    pdfDoc.text('Cliente', 230, y, { width: 240 });
    pdfDoc.text('Fee (USD)', 480, y, { width: 80, align: 'right' });
    pdfDoc.moveDown(0.4);
    pdfDoc.font('Helvetica').moveTo(50, pdfDoc.y).lineTo(545, pdfDoc.y).strokeColor('#eeeeee').stroke();
    pdfDoc.moveDown(0.2);
  };

  header();
  tableHeader();

  const bottom = 780;
  let running = 0;
  for (const o of pending) {
    const fee = parseFloat(String(o.shipping?.deliveryFeeUSD || 0));
    running += fee;
    const fecha = new Date((o as any).updatedAt).toLocaleString('es-VE');
    const cliente = (o.user?.name || o.user?.email || '').toString();
    const y = pdfDoc.y + 2;
    if (y > bottom) {
      pdfDoc.addPage();
      header();
      tableHeader();
    }
    pdfDoc.font('Helvetica').fontSize(10);
    pdfDoc.text(fecha, 50, pdfDoc.y, { width: 100 });
    pdfDoc.text(o.id.slice(0, 8), 160, pdfDoc.y, { width: 60 });
    pdfDoc.text(cliente, 230, pdfDoc.y, { width: 240 });
    pdfDoc.text(fee.toFixed(2), 480, pdfDoc.y, { width: 80, align: 'right' });
    pdfDoc.moveDown(0.3);
  }

  pdfDoc.moveDown(0.6);
  pdfDoc.moveTo(50, pdfDoc.y).lineTo(545, pdfDoc.y).strokeColor('#cccccc').stroke();
  pdfDoc.moveDown(0.4);
  pdfDoc.font('Helvetica-Bold').fontSize(12).text('Total a pagar (USD):', 300, pdfDoc.y, { width: 170, align: 'right' });
  pdfDoc.font('Helvetica-Bold').fontSize(12).text(running.toFixed(2), 480, pdfDoc.y, { width: 80, align: 'right' });

  pdfDoc.end();
  const pdfBuffer = await pdfReady;
  const pdfPath = `payouts/delivery/${deliveryUserId}/${from.replace(/[^0-9-]/g, '')}_${to.replace(/[^0-9-]/g, '')}/payout_${Date.now()}.pdf`;
  const pdfUpload = await put(pdfPath, pdfBuffer as any, { access: 'public', contentType: 'application/pdf' });

  // Mark as paid and record observation
  const now = new Date();
  const obs = `[PAGO DELIVERY] metodo=${paymentMethod || ''}; ref=${paymentReference || ''}; fecha=${paymentDate || ''}; pdf=${pdfUpload.url}; proof=${proofUrl || ''}; notas=${paymentNotes || ''}`;
  let updated = 0;
  if (orderIds.length > 0) {
    const result = await prisma.shipping.updateMany({ where: { orderId: { in: orderIds } }, data: { deliveryPaidAt: now as any, observations: obs } });
    updated = result.count;
  }

  return NextResponse.json({ updated, totalUSD: total, pdfUrl: pdfUpload.url, proofUrl, count: orderIds.length });
}
