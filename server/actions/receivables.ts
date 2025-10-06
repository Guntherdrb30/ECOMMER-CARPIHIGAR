"use server";

import prisma from "@/lib/prisma";
import { getDeleteSecret } from "@/server/actions/settings";
import { revalidatePath } from "next/cache";

async function recalcReceivable(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { receivable: { include: { entries: true } } } });
  if (!order || !order.receivable) return;
  const abonadoUSD = (order.receivable.entries || []).reduce((acc: number, e: any) => acc + Number(e.amountUSD || 0), 0);
  const totalUSD = Number(order.totalUSD || 0);
  let status: any = 'PENDIENTE';
  if (abonadoUSD >= totalUSD - 0.01) status = 'PAGADO';
  else if (abonadoUSD > 0) status = 'PARCIAL';
  await prisma.receivable.update({ where: { id: order.receivable.id }, data: { status } });
  if (status === 'PAGADO') {
    try { await prisma.order.update({ where: { id: orderId }, data: { status: 'PAGADO' as any } }); } catch {}
  }
}

async function generateReceivablePdf(order: any): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default as any;
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const chunks: Buffer[] = [];
  const stream = doc as any;
  stream.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
  const done = new Promise<Buffer>((resolve) => stream.on('end', () => resolve(Buffer.concat(chunks))));

  // Try to include logo from settings
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const logoUrl = (settings as any)?.logoUrl as string | undefined;
    if (logoUrl) {
      if (logoUrl.startsWith('http')) {
        try {
          const res = await fetch(logoUrl);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            (doc as any).image(buf, 36, 24, { fit: [160, 60] });
          }
        } catch {}
      } else {
        const { promises: fs } = await import('fs');
        const path = (await import('path')).default;
        const trimmed = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
        const filePath = path.join(process.cwd(), 'public', trimmed);
        try {
          const buf = await fs.readFile(filePath);
          (doc as any).image(buf, 36, 24, { fit: [160, 60] });
        } catch {}
      }
    }
  } catch {}

  const totalUSD = Number(order.totalUSD || 0);
  const entries = order.receivable?.entries || [];
  const abonadoUSD = entries.reduce((a: number, e: any) => a + Number(e.amountUSD || 0), 0);
  const saldoUSD = Math.max(0, totalUSD - abonadoUSD);
  const vence = (order.receivable?.dueDate || (order as any).creditDueDate || null) as Date | null;

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

export async function addReceivablePayment(formData: FormData) {
  const orderId = String(formData.get('orderId') || '');
  const currency = String(formData.get('currency') || 'USD').toUpperCase() as 'USD'|'VES';
  const method = String(formData.get('method') || '') as any;
  const reference = String(formData.get('reference') || '') || null;
  const notes = String(formData.get('notes') || '') || null;
  const amountStr = String(formData.get('amount') || '0');
  const amount = Number(amountStr);
  const paidAtStr = String(formData.get('paidAt') || '').trim();
  const createdAt = paidAtStr ? new Date(paidAtStr) : undefined;
  if (!orderId || !amount || amount <= 0) {
    return { ok: false, error: 'Datos inválidos' };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { receivable: { include: { entries: true } } } });
  if (!order) return { ok: false, error: 'Orden no encontrada' };

  // Ensure receivable exists
  let receivable = order.receivable;
  if (!receivable) {
    receivable = await prisma.receivable.create({ data: { orderId, status: 'PENDIENTE' as any, dueDate: (order as any).creditDueDate || null } });
  }

  const tasaVES = Number(order.tasaVES || 40);
  const amountUSD = currency === 'USD' ? amount : (amount / (tasaVES || 1));

  await prisma.receivableEntry.create({ data: { receivableId: receivable.id, amountUSD: amountUSD as any, currency: currency as any, method: method || null, reference, notes, ...(createdAt ? { createdAt: createdAt as any } : {}) } });

  // Recalculate status
  const entries = await prisma.receivableEntry.findMany({ where: { receivableId: receivable.id } });
  const abonadoUSD = entries.reduce((acc, e) => acc + Number(e.amountUSD), 0);
  const totalUSD = Number(order.totalUSD);
  let status: any = 'PENDIENTE';
  if (abonadoUSD >= totalUSD - 0.01) status = 'PAGADO';
  else if (abonadoUSD > 0) status = 'PARCIAL';

  await prisma.receivable.update({ where: { id: receivable.id }, data: { status } });
  if (status === 'PAGADO') {
    await prisma.order.update({ where: { id: orderId }, data: { status: 'PAGADO' as any } });
  }

  revalidatePath('/dashboard/admin/cuentas-por-cobrar');
  try { revalidatePath('/dashboard/admin/ventas'); } catch {}
  return { ok: true };
}

export async function markReceivablePaid(formData: FormData) {
  const orderId = String(formData.get('orderId') || '');
  if (!orderId) return { ok: false, error: 'Orden inválida' };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { receivable: { include: { entries: true } } } });
  if (!order) return { ok: false, error: 'Orden no encontrada' };
  if (!order.receivable) {
    await prisma.receivable.create({ data: { orderId, status: 'PAGADO' as any, dueDate: (order as any).creditDueDate || null } });
  } else {
    await prisma.receivable.update({ where: { id: order.receivable.id }, data: { status: 'PAGADO' as any } });
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: 'PAGADO' as any } });
  revalidatePath('/dashboard/admin/cuentas-por-cobrar');
  try { revalidatePath('/dashboard/admin/ventas'); } catch {}
  return { ok: true };
}

export async function updateReceivableDueDate(formData: FormData) {
  const orderId = String(formData.get('orderId') || '');
  const dueDateStr = String(formData.get('dueDate') || '');
  const dueDate = dueDateStr ? new Date(dueDateStr) : null;
  if (!orderId) return { ok: false, error: 'Orden inválida' };
  let receivable = await prisma.receivable.findUnique({ where: { orderId } });
  if (!receivable) {
    receivable = await prisma.receivable.create({ data: { orderId, status: 'PENDIENTE' as any, dueDate } });
  } else {
    await prisma.receivable.update({ where: { id: receivable.id }, data: { dueDate } });
  }
  revalidatePath('/dashboard/admin/cuentas-por-cobrar');
  return { ok: true };
}

export async function updateReceivableEntry(formData: FormData) {
  const entryId = String(formData.get('entryId') || '');
  const orderId = String(formData.get('orderId') || '');
  const amount = Number(String(formData.get('amount') || '0'));
  const currency = String(formData.get('currency') || 'USD').toUpperCase() as 'USD'|'VES';
  const method = String(formData.get('method') || '') || null;
  const reference = String(formData.get('reference') || '') || null;
  const notes = String(formData.get('notes') || '') || null;
  const paidAtStr = String(formData.get('paidAt') || '').trim();
  const createdAt = paidAtStr ? new Date(paidAtStr) : undefined;
  if (!entryId) return { ok: false, error: 'Entrada inválida' } as any;
  const entry = await prisma.receivableEntry.findUnique({ where: { id: entryId }, include: { receivable: { include: { order: true } } } });
  if (!entry) return { ok: false, error: 'Entrada no encontrada' } as any;
  const order = entry.receivable?.order;
  const tasaVES = Number(order?.tasaVES || 40);
  const amountUSD = currency === 'USD' ? amount : (amount / (tasaVES || 1));
  await prisma.receivableEntry.update({ where: { id: entryId }, data: { amountUSD: amountUSD as any, currency: currency as any, method: method as any, reference, notes, ...(createdAt ? { createdAt: createdAt as any } : {}) } });
  await recalcReceivable(order?.id || orderId);
  revalidatePath('/dashboard/admin/cuentas-por-cobrar');
  revalidatePath(`/dashboard/admin/cuentas-por-cobrar/${order?.id || orderId}`);
  return { ok: true } as any;
}

export async function deleteReceivableEntry(formData: FormData) {
  const entryId = String(formData.get('entryId') || '');
  let orderId = String(formData.get('orderId') || '');
  const secret = String(formData.get('secret') || '');
  const configured = await getDeleteSecret();
  if (!configured) {
    return { ok: false, error: 'Falta configurar la clave de eliminación (RECEIVABLE_DELETE_SECRET o ADMIN_DELETE_SECRET)'} as any;
  }
  if (secret !== configured) {
    return { ok: false, error: 'Clave secreta inválida' } as any;
  }
  if (!entryId) return { ok: false, error: 'Entrada inválida' } as any;
  const entry = await prisma.receivableEntry.findUnique({ where: { id: entryId }, include: { receivable: true } });
  if (entry?.receivable?.id) {
    const rec = await prisma.receivable.findUnique({ where: { id: entry.receivable.id }, include: { order: true } });
    orderId = rec?.order?.id || orderId;
  }
  await prisma.receivableEntry.delete({ where: { id: entryId } });
  if (orderId) await recalcReceivable(orderId);
  revalidatePath('/dashboard/admin/cuentas-por-cobrar');
  if (orderId) revalidatePath(`/dashboard/admin/cuentas-por-cobrar/${orderId}`);
  return { ok: true } as any;
}

export async function sendReceivableReminder(formData: FormData) {
  const orderId = String(formData.get('orderId') || '');
  if (!orderId) return { ok: false, error: 'Orden inválida' };
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { receivable: { include: { entries: true } }, user: true } });
  if (!order) return { ok: false, error: 'Orden no encontrada' };
  const to = (order.user as any)?.email as string | undefined;
  if (!to) return { ok: false, error: 'Cliente sin email' };

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const brand = (settings as any)?.brandName || 'Carpihogar.ai';
  const tasaVES = Number(order.tasaVES || (settings as any)?.tasaVES || 40);
  const totalUSD = Number(order.totalUSD || 0);
  const abonadoUSD = (order.receivable?.entries || []).reduce((acc, e: any) => acc + Number(e.amountUSD), 0);
  const saldoUSD = Math.max(0, totalUSD - abonadoUSD);
  const due = order.receivable?.dueDate || (order as any).creditDueDate || null;

  const subject = `${brand} - Recordatorio de pago Orden ${order.id.slice(-6)}`;
  const lines: string[] = [];
  lines.push(`Estimado cliente,`);
  lines.push(`\nLe recordamos que posee un saldo pendiente asociado a su orden ${order.id}.`);
  lines.push(`Total: $${totalUSD.toFixed(2)} | Abonado: $${abonadoUSD.toFixed(2)} | Saldo: $${saldoUSD.toFixed(2)}`);
  if (due) lines.push(`Vencimiento: ${new Date(due as any).toLocaleDateString()}`);
  // Detalle de abonos
  if ((order.receivable?.entries || []).length) {
    lines.push(`\nDetalle de abonos:`);
    for (const e of (order.receivable?.entries || [])) {
      const d = new Date((e as any).createdAt as any);
      lines.push(`- ${d.toLocaleDateString()} $${Number((e as any).amountUSD).toFixed(2)} ${String((e as any).currency)} ${String((e as any).method || '')} ${String((e as any).reference || '')}`.trim());
    }
  }
  lines.push(`\nPuede realizar su abono vía Zelle, Transferencia o Pago Móvil y responder a este correo con el comprobante o referencia.`);
  lines.push(`Gracias por su preferencia.`);
  const text = lines.join('\n');
  const html = text.replace(/\n/g, '<br/>');

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || 'no-reply@localhost';
  if (!host || !user || !pass) {
    console.warn('[sendReceivableReminder] SMTP not configured, skipping send.');
    return { ok: false, skipped: true };
  }

  try {
    const nodemailer = (await import('nodemailer')).default as any;
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    let attachments: any[] = [];
    try {
      const orderFull = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, seller: true, receivable: { include: { entries: true } } } });
      if (orderFull) {
        const pdf = await generateReceivablePdf(orderFull);
        attachments.push({ filename: `cxc_${order.id}.pdf`, content: pdf });
      }
    } catch {}
    await transporter.sendMail({ from, to, subject, text, html, attachments });
    const stamp = new Date().toISOString().slice(0,10);
    try { await prisma.auditLog.create({ data: { userId: undefined, action: 'RECEIVABLE_REMINDER_SENT', details: `order:${orderId} via:EMAIL date:${stamp}` } }); } catch {}
    try {
      const r = await prisma.receivable.findUnique({ where: { orderId } });
      if (r) {
        const newNotes = (((r.notes || '').trim() ? (r.notes + ' | ') : '') + `SHARED:EMAIL:${stamp}`).slice(0, 2000);
        await prisma.receivable.update({ where: { id: r.id }, data: { notes: newNotes } });
      }
    } catch {}
    revalidatePath('/dashboard/admin/cuentas-por-cobrar');
    revalidatePath(`/dashboard/admin/cuentas-por-cobrar/${orderId}`);
    return { ok: true };
  } catch (e) {
    console.error('[sendReceivableReminder] error', e);
    try { await prisma.auditLog.create({ data: { userId: undefined, action: 'RECEIVABLE_REMINDER_FAILED', details: `order:${orderId} error:${String(e)}` } }); } catch {}
    return { ok: false, error: String(e) };
  }
}

export async function runReceivablesReminderJob() {
  // Find open receivables (PENDIENTE, PARCIAL) with bucket VENCIDA (>30 días)
  const open = await prisma.receivable.findMany({
    where: { OR: [ { status: 'PENDIENTE' as any }, { status: 'PARCIAL' as any } ] },
    include: { order: { include: { user: true } }, entries: true },
  });
  let attempted = 0;
  let sent = 0;
  let tagged = 0;
  for (const r of open) {
    const baseDate = r.dueDate ? new Date(r.dueDate as any) : new Date((r.order as any).createdAt as any);
    const days = Math.floor((Date.now() - baseDate.getTime()) / (1000*60*60*24));
    if (days <= 30) continue; // only overdue
    const to = (r.order as any)?.user?.email as string | undefined;
    if (!to) continue;
    attempted++;
    try {
      const fd = new FormData();
      fd.set('orderId', r.orderId);
      const res: any = await sendReceivableReminder(fd as any);
      if (res?.ok) {
        sent++;
        // mark first overdue notification only once
        const already = (r.notes || '').includes('OVERDUE_NOTIFIED');
        if (!already) {
          const stamp = new Date().toISOString().slice(0,10);
          const notes = ((r.notes || '').trim() ? (r.notes + ' | ') : '') + `OVERDUE_NOTIFIED:${stamp}`;
          try { await prisma.receivable.update({ where: { id: r.id }, data: { notes } }); tagged++; } catch {}
        }
      }
    } catch {}
  }
  revalidatePath('/dashboard/admin/cuentas-por-cobrar');
  return { ok: true, attempted, sent, tagged };
}

export async function recordReceivableShare(formData: FormData) {
  const orderId = String(formData.get('orderId') || '');
  const viaRaw = String(formData.get('via') || '').toUpperCase();
  const via = (viaRaw === 'WHATSAPP' || viaRaw === 'EMAIL') ? viaRaw : 'WHATSAPP';
  if (!orderId) return { ok: false, error: 'Orden inválida' };
  const stamp = new Date().toISOString().slice(0,10);
  try { await prisma.auditLog.create({ data: { userId: undefined, action: 'RECEIVABLE_SHARED', details: `order:${orderId} via:${via} date:${stamp}` } }); } catch {}
  try {
    const r = await prisma.receivable.findUnique({ where: { orderId } });
    if (r) {
      const newNotes = (((r.notes || '').trim() ? (r.notes + ' | ') : '') + `SHARED:${via}:${stamp}`).slice(0, 2000);
      await prisma.receivable.update({ where: { id: r.id }, data: { notes: newNotes } });
    }
  } catch {}
  revalidatePath('/dashboard/admin/cuentas-por-cobrar');
  revalidatePath(`/dashboard/admin/cuentas-por-cobrar/${orderId}`);
  return { ok: true };
}

export async function updateReceivableNotes(formData: FormData) {
  const orderId = String(formData.get('orderId') || '');
  const notes = String(formData.get('notes') || '').trim();
  if (!orderId) return { ok: false, error: 'Orden invlda' };
  let receivable = await prisma.receivable.findUnique({ where: { orderId } });
  if (!receivable) {
    receivable = await prisma.receivable.create({ data: { orderId, status: 'PENDIENTE' as any, notes: notes || null } });
  } else {
    await prisma.receivable.update({ where: { id: receivable.id }, data: { notes: notes || null } });
  }
  revalidatePath('/dashboard/admin/cuentas-por-cobrar');
  revalidatePath(`/dashboard/admin/cuentas-por-cobrar/${orderId}`);
  return { ok: true };
}
