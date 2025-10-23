'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

// Best-effort: ensure SiteSettings has new columns in DBs that missed migrations
async function ensureSiteSettingsColumns() {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "public"."SiteSettings" ' +
      'ADD COLUMN IF NOT EXISTS "deleteSecret" TEXT, ' +
      'ADD COLUMN IF NOT EXISTS "defaultMarginClientPct" DECIMAL(5,2), ' +
      'ADD COLUMN IF NOT EXISTS "defaultMarginAllyPct" DECIMAL(5,2), ' +
      'ADD COLUMN IF NOT EXISTS "defaultMarginWholesalePct" DECIMAL(5,2), ' +
      'ADD COLUMN IF NOT EXISTS "heroAutoplayMs" INTEGER, ' +
      'ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT, ' +
      'ADD COLUMN IF NOT EXISTS "tiktokHandle" TEXT'
    );
  } catch {}
}
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSettings() {
  await ensureSiteSettingsColumns();
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
          heroAutoplayMs: 5000 as any,
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
      defaultMarginClientPct: (settings as any).defaultMarginClientPct?.toNumber?.() ?? 40,
      defaultMarginAllyPct: (settings as any).defaultMarginAllyPct?.toNumber?.() ?? 30,
      defaultMarginWholesalePct: (settings as any).defaultMarginWholesalePct?.toNumber?.() ?? 20,
      heroAutoplayMs: Number((settings as any).heroAutoplayMs ?? 5000) || 5000,
    } as any;
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
      heroAutoplayMs: 5000,
      lowStockThreshold: 5,
      sellerCommissionPercent: 5,
      defaultMarginClientPct: 40,
      defaultMarginAllyPct: 30,
      defaultMarginWholesalePct: 20,
    } as any;
  }
}

export async function updateSettings(data: any) {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  // Normalize hero autoplay and enforce first slide as image if available
  const urlsIn = Array.isArray(data?.homeHeroUrls) ? (data.homeHeroUrls as string[]).filter(Boolean) : [];
  const isVideo = (u: string) => {
    const s = String(u || '').toLowerCase();
    return s.endsWith('.mp4') || s.endsWith('.webm') || s.endsWith('.ogg');
  };
  if (urlsIn.length > 1 && isVideo(urlsIn[0])) {
    const idx = urlsIn.findIndex((u) => !isVideo(u));
    if (idx > 0) {
      const t = urlsIn[0]; urlsIn[0] = urlsIn[idx]; urlsIn[idx] = t;
    }
  }
  const msRaw = Number(data?.heroAutoplayMs ?? 5000);
  const heroAutoplayMs = (!isNaN(msRaw) && msRaw > 0) ? Math.min(Math.max(msRaw, 1000), 120000) : 5000;

  const prepared = {
    ...data,
    homeHeroUrls: urlsIn,
    heroAutoplayMs,
  } as any;

  const settings = await prisma.siteSettings.update({
    where: { id: 1 },
    data: prepared,
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
  await ensureSiteSettingsColumns();
  const session = await getServerSession(authOptions);
  const email = (session?.user as any)?.email as string | undefined;
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  // Permitir a cualquier ADMIN configurar la clave de eliminación
  if ((session?.user as any)?.role !== 'ADMIN') {
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
  // Garantizar que exista el registro de SiteSettings (id=1) y actualizar/crear según sea necesario
  try {
    await prisma.siteSettings.update({ where: { id: 1 }, data: { deleteSecret: newSecret } });
  } catch (err) {
    try {
      await prisma.siteSettings.create({
        data: {
          id: 1,
          brandName: 'Carpihogar.ai',
          whatsappPhone: '584120000000',
          contactPhone: '584120000000',
          contactEmail: 'contacto@carpihogar.ai',
          ivaPercent: 16 as any,
          tasaVES: 40 as any,
          primaryColor: '#FF4D00',
          secondaryColor: '#111827',
          logoUrl: '/logo-default.svg',
          homeHeroUrls: [],
          lowStockThreshold: 5,
          sellerCommissionPercent: 5 as any,
          deleteSecret: newSecret,
        } as any,
      });
    } catch (e2) {
      throw e2;
    }
  }
  try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'SYSTEM_DELETE_SECRET_UPDATED', details: `by:${email}` } }); } catch {}
  revalidatePath('/dashboard/admin/ajustes/sistema');
  return { ok: true };
}

export async function setDefaultMargins(formData: FormData) {
  await ensureSiteSettingsColumns();
  const session = await getServerSession(authOptions);
  const email = (session?.user as any)?.email as string | undefined;
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  if ((session?.user as any)?.role !== 'ADMIN' || String(email || '').toLowerCase() !== rootEmail) {
    throw new Error('Not authorized');
  }
  const clientPct = Number(String(formData.get('defaultMarginClientPct') || ''));
  const allyPct = Number(String(formData.get('defaultMarginAllyPct') || ''));
  const wholesalePct = Number(String(formData.get('defaultMarginWholesalePct') || ''));
  if ([clientPct, allyPct, wholesalePct].some(v => isNaN(v) || v < 0)) {
    throw new Error('Valores inválidos');
  }
  await prisma.siteSettings.update({ where: { id: 1 }, data: {
    defaultMarginClientPct: clientPct as any,
    defaultMarginAllyPct: allyPct as any,
    defaultMarginWholesalePct: wholesalePct as any,
  }});
  try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'DEFAULT_MARGINS_SET', details: `client:${clientPct};ally:${allyPct};wholesale:${wholesalePct}` } }); } catch {}
  revalidatePath('/dashboard/admin/ajustes/sistema');
  return { ok: true };
}
