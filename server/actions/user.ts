'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }

  const name = formData.get('name') as string;
  const phoneRaw = String(formData.get('phone') || '');
  const phone = phoneRaw.replace(/[^0-9]/g, '');
  if (!phone) {
    return { success: false, message: 'El número de teléfono es obligatorio para WhatsApp.' };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        phone,
      },
    });
    revalidatePath('/dashboard/cliente/perfil');
    return { success: true, message: 'Perfil actualizado con éxito.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar el perfil.' };
  }
}

export async function changePassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) {
    return { success: false, message: 'Las contraseñas nuevas no coinciden.' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'La contraseña nueva debe tener al menos 6 caracteres.' };
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return { success: false, message: 'Usuario no encontrado.' };
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    return { success: false, message: 'La contraseña actual es incorrecta.' };
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedNewPassword },
    });
    return { success: true, message: 'Contraseña cambiada con éxito.' };
  } catch (error) {
    return { success: false, message: 'Error al cambiar la contraseña.' };
  }
}

