'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateAllyProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id || user?.role !== 'ALIADO') {
    return { ok: false, error: 'No autorizado' };
  }

  const profileImageUrl = String(formData.get('profileImageUrl') || '').trim() || null;
  const bio = String(formData.get('bio') || '').trim() || null;
  const servicesRaw = String(formData.get('services') || '').trim();
  const services = servicesRaw
    ? Array.from(new Set(servicesRaw.split(',').map(s => s.trim()).filter(Boolean)))
    : [];
  
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImageUrl,
        bio,
        services,
      },
    });
  } catch (e: any) {
    const msg = String(e?.message || e || 'Error desconocido');
    if (/column .* does not exist|UndefinedColumn/i.test(msg)) {
      return { ok: false, error: 'Error de base de datos: faltan columnas de perfil de aliado. Ejecuta prisma migrate deploy en producción.' };
    }
    return { ok: false, error: msg };
  }

  // Revalidate ally pages and potential listings
  try { revalidatePath('/dashboard/aliado/perfil'); } catch {}
  try { revalidatePath('/contacto'); } catch {}
  try { revalidatePath('/novedades'); } catch {}

  return { ok: true };
}

export async function getMyAllyProfile() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id || user?.role !== 'ALIADO') {
    throw new Error('Not authorized');
  }
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      profileImageUrl: true,
      bio: true,
      services: true,
      portfolioUrls: true,
      portfolioText: true,
    },
  });
  return me;
}

