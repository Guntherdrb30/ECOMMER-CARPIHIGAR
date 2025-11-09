import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
    return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 401 });
  }
  const id = ctx.params?.id;
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });

  const convo = await prisma.conversation.findUnique({ where: { id }, include: { user: true, assignedTo: true } });
  if (!convo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  const msgs = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 2000 });

  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];
  const bufPromise: Promise<Buffer> = new Promise((resolve, reject) => {
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(16).text('Transcript de Conversación', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`ID: ${convo.id}`);
  doc.text(`Teléfono: ${convo.phone}`);
  doc.text(`Cliente: ${convo.user?.name || ''} ${convo.user?.email ? '('+convo.user.email+')' : ''}`);
  doc.text(`Asignado a: ${convo.assignedTo?.name || convo.assignedTo?.email || 'Sin asignar'}`);
  doc.text(`Estado: ${convo.status}`);
  doc.moveDown();

  for (const m of msgs) {
    const ts = m.createdAt.toISOString().replace('T', ' ').replace('Z','');
    const actor = (m as any).actor || (m.direction === 'IN' ? 'CUSTOMER' : 'AGENT');
    doc.fontSize(9).fillColor('#555').text(`[${ts}] ${actor} • ${m.type}`);
    if (m.text) doc.fontSize(12).fillColor('#000').text(m.text, { align: 'left' });
    if (m.mediaUrl) doc.fontSize(9).fillColor('#333').text(`Media: ${m.mediaUrl}`);
    doc.moveDown(0.5);
  }

  doc.end();
  const buffer = await bufPromise;
  const res = new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf' } });
  res.headers.set('Content-Disposition', `attachment; filename="convo_${convo.id}_transcript.pdf"`);
  return res;
}

