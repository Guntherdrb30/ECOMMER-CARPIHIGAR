"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function buildHtml(order: any, settings: any, tipo: string, moneda: 'USD' | 'VES') {
  const ivaPercent = Number(order.ivaPercent || settings?.ivaPercent || 16);
  const tasaVES = Number(order.tasaVES || settings?.tasaVES || 40);
  const subtotalUSD = Number(order.subtotalUSD || 0);
  const ivaUSD = (subtotalUSD * ivaPercent) / 100;
  const totalUSD = Number(order.totalUSD || (subtotalUSD + ivaUSD));
  const totalVES = Number(order.totalVES || (totalUSD * tasaVES));
  const fmt = (v: number) => (moneda === 'VES' ? `Bs ${v.toFixed(2)}` : `$ ${v.toFixed(2)}`);

  const totalShow = moneda === 'VES' ? totalVES : totalUSD;

  const brand = settings?.brandName || 'Carpihogar.ai';
  const logo = (settings as any)?.logoUrl as string | undefined;
  const logoBlock = logo ? `<div style="margin:8px 0 4px 0;"><img src="${logo}" alt="${brand}" style="height:40px;vertical-align:middle"/></div>` : '';

  return `
  <div style="font-family: system-ui, Arial, sans-serif; color:#111;">
    ${logoBlock}
    <h2 style="margin:0 0 8px 0;">${brand} — ${tipo}</h2>
    <div style="font-size:12px;color:#555;margin-bottom:12px;">Orden ${order.id} · Fecha: ${new Date(order.createdAt).toLocaleString()}</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">Producto</th>
          <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Precio</th>
          <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Cant.</th>
          <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((it: any) => {
          const p = Number(it.priceUSD);
          const sub = p * Number(it.quantity);
          return `<tr>
            <td style="border-bottom:1px solid #f0f0f0;padding:6px;">${it.name}</td>
            <td style="border-bottom:1px solid #f0f0f0;padding:6px;text-align:right;">${fmt(moneda==='VES'?p*tasaVES:p)}</td>
            <td style="border-bottom:1px solid #f0f0f0;padding:6px;text-align:right;">${it.quantity}</td>
            <td style="border-bottom:1px solid #f0f0f0;padding:6px;text-align:right;">${fmt(moneda==='VES'?sub*tasaVES:sub)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <div style="text-align:right;margin-top:8px;font-size:14px;">
      <div>IVA (${ivaPercent}%): ${fmt(moneda==='VES'?ivaUSD*tasaVES:ivaUSD)}</div>
      <div style="font-weight:bold;">Total: ${fmt(totalShow)}</div>
    </div>
    <div style="margin-top:12px;font-size:12px;color:#666;">Gracias por su compra.</div>
  </div>`;
}

export async function sendReceiptEmail(orderId: string, to: string, tipo: 'recibo' | 'nota' | 'factura' = 'recibo', moneda: 'USD' | 'VES' = 'USD') {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');
  if (!to) throw new Error('Missing email');

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: true, payment: true } });
  if (!order) throw new Error('Order not found');

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const subject = `${settings?.brandName || 'Carpihogar.ai'} — ${tipo} ${order.id.slice(-6)}`;
  const html = buildHtml(order, settings, tipo, moneda);

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || 'no-reply@localhost';

  if (!host || !user || !pass) {
    console.warn('[sendReceiptEmail] SMTP not configured, skipping send.');
    return { ok: false, skipped: true } as any;
  }

  try {
    // Lazy import to avoid bundling issues if not available
    const nodemailer = (await import('nodemailer')).default as any;
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    await transporter.sendMail({ from, to, subject, html });
    return { ok: true } as any;
  } catch (e) {
    console.error('[sendReceiptEmail] error', e);
    return { ok: false, error: String(e) } as any;
  }
}

export async function sendReceiptEmailByForm(formData: FormData) {
  const orderId = String(formData.get('orderId') || '');
  const to = String(formData.get('to') || '');
  const tipo = (String(formData.get('tipo') || 'recibo').toLowerCase() as any) as 'recibo'|'nota'|'factura';
  const moneda = (String(formData.get('moneda') || 'USD').toUpperCase() as any) as 'USD'|'VES';
  await sendReceiptEmail(orderId, to, tipo, moneda);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const subject = `${settings?.brandName || 'Carpihogar.ai'} — Restablecer Contraseña`;
  const resetLink = `${process.env.NEXT_PUBLIC_URL}/auth/reset-password?token=${token}`;

  const html = `
  <div style="font-family: system-ui, Arial, sans-serif; color:#111;">
    <h2 style="margin:0 0 8px 0;">${settings?.brandName || 'Carpihogar.ai'} — Restablecer Contraseña</h2>
    <p>Recibimos una solicitud para restablecer tu contraseña. Si no has sido tú, puedes ignorar este correo.</p>
    <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>Este enlace expirará en 1 hora.</p>
  </div>`;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || 'no-reply@localhost';

  if (!host || !user || !pass) {
    console.warn('[sendPasswordResetEmail] SMTP not configured, skipping send.');
    return { ok: false, skipped: true } as any;
  }

  try {
    const nodemailer = (await import('nodemailer')).default as any;
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    await transporter.sendMail({ from, to, subject, html });
    return { ok: true } as any;
  } catch (e) {
    console.error('[sendPasswordResetEmail] error', e);
    return { ok: false, error: String(e) } as any;
  }
}
