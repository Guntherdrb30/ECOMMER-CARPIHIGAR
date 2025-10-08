'use server';

import prisma from '@/lib/prisma';
import { sendWhatsAppText } from '@/lib/whatsapp';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

function normalizePhoneE164(phone: string): string {
  // Accept numbers like 58412..., +58412..., 0412..., etc. Try to coerce to E.164 with country code.
  let p = String(phone || '').replace(/[^0-9+]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+') && /^58\d{10}$/.test(p)) p = '+' + p; // VE numbers without plus
  return p;
}

export async function setRootRecoverySettings(formData: FormData) {
  // Only ROOT (admin with root email) can configure
  const email = String(formData.get('email') || '').toLowerCase();
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  const token = String(formData.get('token') || ''); // CSRF-ish no-op for now
  void token; // silence unused
  if (email !== rootEmail) {
    throw new Error('Not authorized');
  }
  const phone = normalizePhoneE164(String(formData.get('rootPhone') || ''));
  const newSecret = String(formData.get('rootSecret') || '').trim();
  const confirm = String(formData.get('rootSecretConfirm') || '').trim();
  if (!phone) throw new Error('Telefono invalido');
  if (newSecret && newSecret !== confirm) throw new Error('Las claves no coinciden');

  const data: any = { rootPhone: phone };
  if (newSecret) {
    const hash = await bcrypt.hash(newSecret, 10);
    data.rootRecoveryHash = hash;
  }
  await prisma.siteSettings.update({ where: { id: 1 }, data });
  revalidatePath('/dashboard/admin/ajustes/sistema');
  return { ok: true };
}

export async function startRootRecovery(formData: FormData) {
  const secret = String(formData.get('secret') || '').trim();
  const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!s?.rootRecoveryHash) {
    throw new Error('Recuperacion no configurada');
  }
  const ok = await bcrypt.compare(secret, s.rootRecoveryHash);
  if (!ok) throw new Error('Clave de recuperacion invalida');

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await prisma.siteSettings.update({ where: { id: 1 }, data: { rootResetCode: code, rootResetCodeExpiresAt: expires } });

  const to = normalizePhoneE164(String(s.rootPhone || ''));
  if (!to) throw new Error('Telefono no configurado');
  const result = await sendWhatsAppText(to, `Codigo de recuperacion ROOT: ${code} (valido por 10 min)`);
  if (!result.ok) {
    throw new Error('No se pudo enviar WhatsApp: ' + result.error);
  }
  return { ok: true };
}

export async function completeRootRecovery(formData: FormData) {
  const code = String(formData.get('code') || '').trim();
  const newPassword = String(formData.get('newPassword') || '').trim();
  const confirm = String(formData.get('confirm') || '').trim();
  if (!code) throw new Error('Codigo requerido');
  if (!newPassword || newPassword.length < 6) throw new Error('Contrasena invalida (minimo 6)');
  if (newPassword !== confirm) throw new Error('Las contrasenas no coinciden');

  const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!s?.rootResetCode || !s.rootResetCodeExpiresAt) throw new Error('No hay solicitud activa');
  if (s.rootResetCode !== code) throw new Error('Codigo invalido');
  if (new Date(s.rootResetCodeExpiresAt).getTime() < Date.now()) throw new Error('Codigo expirado');

  const hash = await bcrypt.hash(newPassword, 10);
  const rootEmail2 = String(process.env.ROOT_EMAIL || 'root@carpihogar.com');
  await prisma.user.update({ where: { email: rootEmail2 }, data: { password: hash } });
  await prisma.siteSettings.update({ where: { id: 1 }, data: { rootResetCode: null, rootResetCodeExpiresAt: null } });
  return { ok: true };
}
