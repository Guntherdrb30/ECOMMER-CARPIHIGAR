'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createAllyProject(formData: FormData) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id || user?.role !== 'ALIADO') {
    return { ok: false, error: 'No autorizado' };
  }

  const images = Array.from(formData.getAll('projectImages[]') || [])
    .map((v) => String(v || '').trim())
    .filter(Boolean);
  const caption = String(formData.get('projectCaption') || '').trim() || null;
  const videoUrl = String(formData.get('projectVideoUrl') || '').trim() || null;

  // Enforce max 4 images
  const seen = new Set<string>();
  const safeImages = images.filter((u) => {
    const k = u.trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 4);

  if (safeImages.length === 0 && !videoUrl) {
    return { ok: false, error: 'Agrega al menos 1 imagen o video' };
  }

  // One project per day per ally
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const todayCount = await prisma.allyProject.count({ where: { userId: user.id, createdAt: { gte: start, lt: tomorrow } } });
  if (todayCount > 0) {
    return { ok: false, error: 'Ya publicaste un proyecto hoy' };
  }

  // Create project
  const project = await prisma.allyProject.create({
    data: { userId: user.id, images: safeImages, videoUrl, caption },
  });

  // Keep only last two projects
  const projects = await prisma.allyProject.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  const toDelete = projects.slice(2).map((p) => p.id);
  if (toDelete.length) {
    await prisma.allyProject.deleteMany({ where: { id: { in: toDelete } } });
  }

  // Create a News entry (one per day)
  const existingNews = await prisma.news.count({ where: { authorId: user.id, createdAt: { gte: start, lt: tomorrow } } });
  if (existingNews === 0) {
    const preview = safeImages[0] || '';
    if (preview) {
      const me = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });
      await prisma.news.create({
        data: {
          authorId: user.id,
          imageUrl: preview,
          title: `Nuevo proyecto de ${me?.name || 'aliado'}`,
          excerpt: caption,
        },
      });
    }
  }

  try { revalidatePath('/novedades'); } catch {}
  try { revalidatePath('/dashboard/aliado/perfil'); } catch {}
  try { revalidatePath(`/aliados/${user.id}`); } catch {}

  return { ok: true, id: project.id };
}
