'use server';

import { revalidatePath } from 'next/cache';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDeleteSecret } from '@/server/actions/settings';

const prisma = new PrismaClient();

export async function requestAlly() {
  const session = await getServerSession(authOptions);

  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    throw new Error('Not authenticated');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { alliedStatus: 'PENDING' },
  });

  revalidatePath('/');
}

export async function approveAlly(userId: string) {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'ALIADO', alliedStatus: 'APPROVED' },
  });

  revalidatePath('/dashboard/admin/usuarios');
}

export async function getUsers() {
    const session = await getServerSession(authOptions);

    if ((session?.user as any)?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        alliedStatus: true,
        commissionPercent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Decimal/Date to JSON-safe values
    return users.map((u: any) => ({
      ...u,
      commissionPercent: u.commissionPercent == null ? null : Number(u.commissionPercent),
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    }));
}

export async function createAdminUser(name: string, email: string, password: string) {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  const bcrypt = (await import('bcrypt')).default;
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed, role: 'ADMIN', alliedStatus: 'NONE' },
    create: { name, email, password: hashed, role: 'ADMIN', alliedStatus: 'NONE' },
  });

  revalidatePath('/dashboard/admin/usuarios');
  return user;
}

export async function createSellerUser(name: string, email: string, password: string, commissionPercent?: number) {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  const bcrypt = (await import('bcrypt')).default;
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed, role: 'VENDEDOR', alliedStatus: 'NONE', commissionPercent: (commissionPercent ?? null) as any },
    create: { name, email, password: hashed, role: 'VENDEDOR', alliedStatus: 'NONE', commissionPercent: (commissionPercent ?? null) as any },
  });

  revalidatePath('/dashboard/admin/usuarios');
  return user;
}

export async function updateUser(formData: FormData) {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  const id = String(formData.get('id'));
  const name = formData.get('name');
  const role = formData.get('role');
  const commission = formData.get('commissionPercent');

  const current = await prisma.user.findUnique({ where: { id }, select: { role: true, commissionPercent: true, name: true } });
  if (!current) throw new Error('User not found');

  const data: any = {};
  if (name !== null) data.name = String(name);
  if (role !== null) {
    const r = String(role);
    if (['CLIENTE','ALIADO','VENDEDOR','ADMIN'].includes(r)) data.role = r as any;
  }

  let commissionLogNeeded = false;
  let oldCommission = current.commissionPercent as any;
  let newCommission: number | null | undefined = undefined;
  const effectiveRole = (data.role ?? current.role) as string;
  if (commission !== null) {
    if (effectiveRole === 'VENDEDOR') {
      const num = String(commission).length ? parseFloat(String(commission)) : null;
      data.commissionPercent = (num === null ? null : (num as any));
      newCommission = num;
      commissionLogNeeded = true;
    } else {
      // If not seller, ignore commission changes
    }
  }

  await prisma.user.update({ where: { id }, data });

  if (commissionLogNeeded) {
    await prisma.auditLog.create({
      data: {
        userId: (session?.user as any)?.id,
        action: 'SELLER_COMMISSION_UPDATE',
        details: `target:${id};from:${oldCommission ?? 'null'};to:${newCommission ?? 'null'}`,
      },
    });
  }

  revalidatePath('/dashboard/admin/usuarios');
}


export async function deleteUserByForm(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Not authorized');
  }

  const id = String(formData.get('id') || '');
  const secret = String(formData.get('secret') || '').trim();
  const configured = await getDeleteSecret();
  if (!configured) {
    throw new Error('Falta configurar la clave de eliminación');
  }
  if (secret !== configured) {
    throw new Error('Clave secreta inválida');
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!target) throw new Error('Usuario no encontrado');
  const email = String(target.email || '').toLowerCase();
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  if (email === rootEmail) {
    throw new Error('No se puede eliminar el usuario root');
  }
  if (String((session?.user as any)?.id || '') === id) {
    throw new Error('No puedes eliminar tu propio usuario');
  }

  try {
    await prisma.user.delete({ where: { id } });
    try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'USER_DELETE', details: `id:${id};email:${email}` } }); } catch {}
  } catch (e) {
    throw new Error('No se puede eliminar: tiene registros relacionados');
  }

  revalidatePath('/dashboard/admin/usuarios');
  return { ok: true } as any;
}


export async function updateUserPasswordByForm(formData: FormData) {
  const session = await getServerSession(authOptions);
  const email = String((session?.user as any)?.email || '').toLowerCase();
  const role = String((session?.user as any)?.role || '');
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  if (!(role === 'ADMIN' && email === rootEmail)) {
    throw new Error('Not authorized');
  }

  const id = String(formData.get('id') || '');
  const newPassword = String(formData.get('newPassword') || '').trim();
  const confirm = String(formData.get('confirm') || '').trim();
  if (!id) throw new Error('User id requerido');
  if (!newPassword || newPassword.length < 6) throw new Error('Contraseña inválida (mínimo 6)');
  if (newPassword !== confirm) throw new Error('Las contraseñas no coinciden');

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!target) throw new Error('Usuario no encontrado');

  const bcrypt = (await import('bcrypt')).default;
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });

  try {
    await prisma.auditLog.create({
      data: {
        userId: (session?.user as any)?.id,
        action: 'USER_PASSWORD_RESET',
        details: `target:${id};by:${email}`,
      },
    });
  } catch {}

  revalidatePath('/dashboard/admin/usuarios');
  return { ok: true } as any;
}


