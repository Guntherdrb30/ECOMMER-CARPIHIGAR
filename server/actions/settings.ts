'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSettings() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 1,
          brandName: 'Carpihogar.ai',
          whatsappPhone: '584120000000',
          contactPhone: '584120000000',
          contactEmail: 'contacto@carpihogar.ai',
          ivaPercent: 16,
          tasaVES: 40,
          primaryColor: '#FF4D00',
          secondaryColor: '#111827',
          logoUrl: '/logo-default.svg',
          homeHeroUrls: [],
          lowStockThreshold: 5,
          sellerCommissionPercent: 5,
        } as any,
      });
    }

    return {
      ...settings,
      ivaPercent: settings.ivaPercent.toNumber(),
      tasaVES: settings.tasaVES.toNumber(),
      sellerCommissionPercent: settings.sellerCommissionPercent.toNumber(),
    };
  } catch (err) {
    console.warn('[getSettings] DB not reachable, using defaults.', err);
    return {
      id: 1,
      brandName: 'Carpihogar.ai',
      whatsappPhone: '584120000000',
      contactPhone: '584120000000',
      contactEmail: 'contacto@carpihogar.ai',
      ivaPercent: 16,
      tasaVES: 40,
      primaryColor: '#FF4D00',
      secondaryColor: '#111827',
      logoUrl: '/logo-default.svg',
      homeHeroUrls: [],
      lowStockThreshold: 5,
      sellerCommissionPercent: 5,
    } as any;
  }
}

export async function updateSettings(data: any) {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  const settings = await prisma.siteSettings.update({
    where: { id: 1 },
    data,
  });

  revalidatePath('/dashboard/admin/ajustes');
  try { revalidatePath('/', 'layout' as any); } catch {}
  try { revalidatePath('/'); } catch {}
  return settings;
}

export async function getAuditLogs(params?: { take?: number; actions?: string[] }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  const where: any = {};
  if (params?.actions?.length) where.action = { in: params.actions } as any;
  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: params?.take ?? 50 });
  return logs;
}

export async function getDeleteSecret(): Promise<string> {
  const settings = await getSettings();
  const fromDb = (settings as any).deleteSecret || '';
  if (fromDb && fromDb.trim()) return String(fromDb);
  const fromEnv = process.env.RECEIVABLE_DELETE_SECRET || process.env.ADMIN_DELETE_SECRET || '';
  return fromEnv;
}

export async function setDeleteSecret(formData: FormData) {
  const session = await getServerSession(authOptions);
  const email = (session?.user as any)?.email as string | undefined;
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  if ((session?.user as any)?.role !== 'ADMIN' || String(email || '').toLowerCase() !== rootEmail) {
    throw new Error('Not authorized');
  }
  const newSecret = String(formData.get('newSecret') || '').trim();
  const confirm = String(formData.get('confirm') || '').trim();
  if (!newSecret || newSecret.length < 6) {
    throw new Error('La clave debe tener al menos 6 caracteres');
  }
  if (newSecret !== confirm) {
    throw new Error('Las claves no coinciden');
  }
  await prisma.siteSettings.update({ where: { id: 1 }, data: { deleteSecret: newSecret } });
  try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'SYSTEM_DELETE_SECRET_UPDATED', details: `by:${email}` } }); } catch {}
  revalidatePath('/dashboard/admin/ajustes/sistema');
  return { ok: true };
}
