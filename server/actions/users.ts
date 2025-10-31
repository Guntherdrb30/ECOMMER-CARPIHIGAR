'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDeleteSecret } from '@/server/actions/settings';

const prisma = new PrismaClient();

export async function requestAlly() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error('Not authenticated');
  await prisma.user.update({ where: { id: userId }, data: { alliedStatus: 'PENDING' } });
  revalidatePath('/');
}

export async function approveAlly(userId: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  await prisma.user.update({ where: { id: userId }, data: { role: 'ALIADO', alliedStatus: 'APPROVED' } });
  revalidatePath('/dashboard/admin/usuarios');
  try { redirect('/dashboard/admin/usuarios?message=Aliado%20aprobado'); } catch {}
}

export async function getUsers(q?: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const where: any = {};
  const query = String(q || '').trim();
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } as any },
      { email: { contains: query, mode: 'insensitive' } as any },
      { phone: { contains: query, mode: 'insensitive' } as any },
      // Coincidencias por Cédula/RIF a partir de pedidos del usuario
      { orders: { some: { customerTaxId: { contains: query, mode: 'insensitive' } as any } } },
    ];
  }
  const users = await prisma.user.findMany({ where, select: { id:true, name:true, email:true, phone:true, role:true, alliedStatus:true, commissionPercent:true, createdAt:true }, orderBy: { createdAt: 'desc' } });
  return users.map((u: any) => ({ ...u, commissionPercent: u.commissionPercent == null ? null : Number(u.commissionPercent), createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null }));
}

export async function createAdminUser(name: string, email: string, password: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const bcrypt = (await import('bcrypt')).default; const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({ where: { email }, update: { name, password: hashed, role: 'ADMIN', alliedStatus: 'NONE' }, create: { name, email, password: hashed, role: 'ADMIN', alliedStatus: 'NONE' } });
  revalidatePath('/dashboard/admin/usuarios');
  return user;
}

export async function createSellerUser(name: string, email: string, password: string, commissionPercent?: number) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const bcrypt = (await import('bcrypt')).default; const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({ where: { email }, update: { name, password: hashed, role: 'VENDEDOR', alliedStatus: 'NONE', commissionPercent: (commissionPercent ?? null) as any }, create: { name, email, password: hashed, role: 'VENDEDOR', alliedStatus: 'NONE', commissionPercent: (commissionPercent ?? null) as any } });
  revalidatePath('/dashboard/admin/usuarios');
  return user;
}

export async function updateUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const id = String(formData.get('id'));
  const name = formData.get('name');
  const role = formData.get('role');
  const commission = formData.get('commissionPercent');
  const current = await prisma.user.findUnique({ where: { id }, select: { role:true, commissionPercent:true, name:true } });
  if (!current) { try { redirect('/dashboard/admin/usuarios?error=Usuario%20no%20encontrado'); } catch {} ; return { ok:false } as any; }
  const data: any = {};
  if (name !== null) data.name = String(name);
  if (role !== null) { const r = String(role); if (['CLIENTE','ALIADO','VENDEDOR','ADMIN'].includes(r)) data.role = r as any; }
  let commissionLogNeeded = false; let oldCommission = current.commissionPercent as any; let newCommission: number | null | undefined = undefined; const effectiveRole = (data.role ?? current.role) as string;
  if (commission !== null && effectiveRole === 'VENDEDOR') { const num = String(commission).length ? parseFloat(String(commission)) : null; data.commissionPercent = (num === null ? null : (num as any)); newCommission = num; commissionLogNeeded = true; }
  try { await prisma.user.update({ where: { id }, data }); } catch { try { redirect('/dashboard/admin/usuarios?error=No%20se%20pudo%20actualizar'); } catch {} ; return { ok:false } as any; }
  if (commissionLogNeeded) { try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'SELLER_COMMISSION_UPDATE', details: `target:${id};from:${oldCommission ?? 'null'};to:${newCommission ?? 'null'}` } }); } catch {} }
  revalidatePath('/dashboard/admin/usuarios');
  try { redirect('/dashboard/admin/usuarios?message=Cambios%20guardados'); } catch {}
  return { ok:true } as any;
}

export async function deleteUserByForm(formData: FormData) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Not authorized');
  const id = String(formData.get('id') || '');
  const secret = String(formData.get('secret') || '').trim();
  const configured = await getDeleteSecret();
  if (!configured) { try { redirect('/dashboard/admin/usuarios?error=Falta%20configurar%20la%20clave'); } catch {} ; return { ok:false } as any; }
  if (secret !== configured) { try { redirect('/dashboard/admin/usuarios?error=Clave%20secreta%20inv%C3%A1lida'); } catch {} ; return { ok:false } as any; }
  const target = await prisma.user.findUnique({ where: { id }, select: { id:true, email:true } });
  if (!target) { try { redirect('/dashboard/admin/usuarios?error=Usuario%20no%20encontrado'); } catch {} ; return { ok:false } as any; }
  const email = String(target.email || '').toLowerCase(); const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  if (email === rootEmail) { try { redirect('/dashboard/admin/usuarios?error=No%20se%20puede%20eliminar%20el%20usuario%20root'); } catch {} ; return { ok:false } as any; }
  if (String((session?.user as any)?.id || '') === id) { try { redirect('/dashboard/admin/usuarios?error=No%20puedes%20eliminar%20tu%20propio%20usuario'); } catch {} ; return { ok:false } as any; }
  try { await prisma.user.delete({ where: { id } }); try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'USER_DELETE', details: `id:${id};email:${email}` } }); } catch {} } catch { try { redirect('/dashboard/admin/usuarios?error=No%20se%20puede%20eliminar%3A%20tiene%20registros%20relacionados'); } catch {} ; return { ok:false } as any; }
  revalidatePath('/dashboard/admin/usuarios');
  try { redirect('/dashboard/admin/usuarios?message=Usuario%20eliminado'); } catch {}
  return { ok:true } as any;
}

export async function updateUserPasswordByForm(formData: FormData) {
  const session = await getServerSession(authOptions);
  const email = String((session?.user as any)?.email || '').toLowerCase();
  const role = String((session?.user as any)?.role || '');
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  if (!(role === 'ADMIN' && email === rootEmail)) { redirect('/dashboard/admin/usuarios?pw=err'); }
  const id = String(formData.get('id') || '');
  const newPassword = String(formData.get('newPassword') || '').trim();
  const confirm = String(formData.get('confirm') || '').trim();
  if (!id) redirect('/dashboard/admin/usuarios?pw=err');
  const hasNumber = /\d/.test(newPassword); if (!newPassword || newPassword.length < 8 || !hasNumber) redirect('/dashboard/admin/usuarios?pw=err');
  if (newPassword !== confirm) redirect('/dashboard/admin/usuarios?pw=err');
  const target = await prisma.user.findUnique({ where: { id }, select: { id:true, email:true } }); if (!target) redirect('/dashboard/admin/usuarios?pw=err');
  try { const bcrypt = (await import('bcrypt')).default; const hashed = await bcrypt.hash(newPassword, 10); await prisma.user.update({ where: { id }, data: { password: hashed } }); try { await prisma.auditLog.create({ data: { userId: (session?.user as any)?.id, action: 'USER_PASSWORD_RESET', details: `target:${id};by:${email}` } }); } catch {}; revalidatePath('/dashboard/admin/usuarios'); redirect('/dashboard/admin/usuarios?pw=ok'); } catch { redirect('/dashboard/admin/usuarios?pw=err'); }
}
