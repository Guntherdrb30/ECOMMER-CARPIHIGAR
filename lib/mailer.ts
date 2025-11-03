import nodemailer from 'nodemailer';

type MailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{ filename: string; content: any; contentType?: string }>;
};

let cachedTransport: any;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  cachedTransport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return cachedTransport;
}

export async function sendMail({ to, subject, html, text, attachments }: MailInput) {
  if (process.env.EMAIL_ENABLED !== 'true') return { ok: false, skipped: 'EMAIL_ENABLED!=true' } as any;
  const transport = getTransport();
  if (!transport) return { ok: false, skipped: 'SMTP not configured' } as any;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'root@carpihogar.com';
  try {
    await transport.sendMail({ from, to, subject, html, text, attachments });
    return { ok: true };
  } catch (e) {
    console.warn('[mailer] sendMail failed', (e as any)?.message || e);
    return { ok: false } as any;
  }
}

export function basicTemplate(title: string, bodyHtml: string) {
  const brand = process.env.BRAND_NAME || 'Carpihogar.ai';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td></td><td style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#0ea5e9;color:#fff;padding:12px 16px;font-weight:700">${brand}</div><div style="padding:16px;color:#0f172a">${bodyHtml}</div><div style="padding:12px 16px;color:#475569;font-size:12px;border-top:1px solid #e2e8f0">Este es un correo automático, por favor no responda. Contacto: ${process.env.CONTACT_EMAIL || 'root@carpihogar.com'}</div></td><td></td></tr></table></body></html>`;
}

