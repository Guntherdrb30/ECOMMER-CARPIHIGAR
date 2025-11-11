import prisma from '@/lib/prisma';
import { TEMPLATES } from './templates';
import { sendWhatsAppMessage } from './sendWhatsAppMessage';

export async function sendVerificationToken(customerId: string, phone: string, orderTempId: string) {
  const token = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.purchaseToken.create({ data: { customerId, orderTempId, token, expiresAt: expiresAt as any } as any });
  const text = TEMPLATES.CONFIRMATION_TOKEN(token);
  const res = await sendWhatsAppMessage({ phone, text });
  return { ok: !!res.ok, tokenPreview: token.replace(/\d{4}$/, '****') };
}
