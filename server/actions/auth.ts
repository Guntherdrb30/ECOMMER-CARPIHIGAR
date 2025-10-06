"use server";

import prisma from '@/lib/prisma';
import { randomBytes, createHash } from 'crypto';
import { sendPasswordResetEmail } from './email';

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');

    const passwordResetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hash,
        passwordResetTokenExpiresAt,
      },
    });

    // This function needs to be created in email.ts
    await sendPasswordResetEmail(user.email, token);
  }

  // Always return a success message to prevent email enumeration
  return { message: 'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.' };
}

export async function resetPassword(token: string, newPassword: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findUnique({
        where: {
            passwordResetToken: hashedToken,
            passwordResetTokenExpiresAt: { gt: new Date() }
        }
    });

    if (!user) {
        throw new Error('El token es inválido o ha expirado.');
    }

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: passwordHash,
            passwordResetToken: null,
            passwordResetTokenExpiresAt: null,
        }
    });

    return { message: 'Contraseña actualizada correctamente.' };
}
