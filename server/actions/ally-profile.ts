'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateAllyProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id || user?.role !== 'ALIADO') {
    throw new Error('Not authorized');
  }

  const profileImageUrl = String(formData.get('profileImageUrl') || '').trim() || null;
  const bio = String(formData.get('bio') || '').trim() || null;
  const portfolioText = String(formData.get('portfolioText') || '').trim() || null;
  const servicesRaw = String(formData.get('services') || '').trim();
  const services = servicesRaw
    ? Array.from(new Set(servicesRaw.split(',').map(s => s.trim()).filter(Boolean)))
    : [];
  const portfolioUrls = Array.from(formData.getAll('portfolioUrls[]') || [])
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      profileImageUrl,
      bio,
      portfolioText,
      services,
      portfolioUrls,
    },
  });

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

