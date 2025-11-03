import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { put } from '@vercel/blob';

function startOfDay(d: Date) { const x=new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x=new Date(d); x.setHours(23,59,59,999); return x; }

export const dynamic = 'force-dynamic';

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

  // Generate CSV payout file
  const csvLines = [
    'OrderId,Fecha,Cliente,Email,FeeUSD',
    ...pending.map(o => {
      const dt = new Date((o as any).updatedAt).toISOString();
      const cliente = (o.user?.name || '').replaceAll(',', ' ');
      const email = (o.user?.email || '').replaceAll(',', ' ');
      const fee = String(o.shipping?.deliveryFeeUSD || '');
      return `${o.id},${dt},${cliente},${email},${fee}`;
    }),
    `TOTAL,,,,${total.toFixed(2)}`,
  ];
  const csv = csvLines.join('\n');
  const csvPath = `payouts/delivery/${deliveryUserId}/${from.replace(/[^0-9-]/g, '')}_${to.replace(/[^0-9-]/g, '')}/payout_${Date.now()}.csv`;
  const csvUpload = await put(csvPath, new Blob([csv], { type: 'text/csv' }), { access: 'public', contentType: 'text/csv' });

  // Mark as paid and record observation
  const now = new Date();
  const obs = `[PAGO DELIVERY] metodo=${paymentMethod || ''}; ref=${paymentReference || ''}; fecha=${paymentDate || ''}; csv=${csvUpload.url}; proof=${proofUrl || ''}; notas=${paymentNotes || ''}`;
  let updated = 0;
  if (orderIds.length > 0) {
    const result = await prisma.shipping.updateMany({ where: { orderId: { in: orderIds } }, data: { deliveryPaidAt: now as any, observations: obs } });
    updated = result.count;
  }

  return NextResponse.json({ updated, totalUSD: total, csvUrl: csvUpload.url, proofUrl, count: orderIds.length });
}

