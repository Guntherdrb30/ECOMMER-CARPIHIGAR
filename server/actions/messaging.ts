'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendWhatsAppText } from '@/lib/whatsapp';
import { redirect } from 'next/navigation';

export async function getConversations(params?: { status?: 'OPEN'|'IN_PROGRESS'|'PENDING'|'RESOLVED'|'CLOSED'|string; mine?: boolean; unassigned?: boolean }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const where: any = {};
  if (params?.status) where.status = params.status as any;
  if (params?.mine) where.assignedToId = (session?.user as any)?.id;
  if (params?.unassigned) where.assignedToId = null as any;
  const convos = await prisma.conversation.findMany({ where, orderBy: { lastMessageAt: 'desc' }, include: { user: true, assignedTo: true }, take: 200 });
  return convos as any;
}

export async function getConversationWithMessages(id: string) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const convo = await prisma.conversation.findUnique({ where: { id }, include: { user: true, assignedTo: true } });
  if (!convo) throw new Error('Conversation not found');
  const messages = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 500 });
  try { await prisma.conversation.update({ where: { id }, data: { unreadAgent: 0 } }); } catch {}
  return { convo, messages } as any;
}

async function ensureConversation(phone: string, userId?: string | null) {
  const p = phone.replace(/[^0-9]/g, '');
  let convo = await prisma.conversation.findFirst({ where: { phone: p } });
  if (!convo) {
    convo = await prisma.conversation.create({ data: { phone: p, userId: userId || undefined, lastMessageAt: new Date() } });
  }
  return convo;
}

export async function sendMessageAction(_prev: any, form: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) return { ok: false, error: 'Not authorized' };
  const toPhone = String(form.get('toPhone') || '');
  const text = String(form.get('text') || '').trim();
  const userId = String(form.get('userId') || '') || undefined;
  if (!toPhone || !text) return { ok: false, error: 'Falta teléfono o texto' };
  const convo = await ensureConversation(toPhone, userId);
  const res = await sendWhatsAppText(toPhone, text);
  await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUT' as any, status: res.ok ? ('SENT' as any) : ('FAILED' as any), type: 'TEXT', text, waMessageId: res.id } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastOutboundAt: new Date(), unreadCustomer: { increment: 1 } as any } });
  revalidatePath('/dashboard/admin/mensajeria', 'page' as any);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function ingestInboundMessage(phone: string, text: string, waMessageId?: string) {
  const convo = await ensureConversation(phone, undefined);
  await prisma.message.create({ data: { conversationId: convo.id, direction: 'IN' as any, status: 'DELIVERED' as any, type: 'TEXT', text, waMessageId } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastInboundAt: new Date(), unreadAgent: { increment: 1 } as any } });
  try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
  return { ok: true } as any;
}

export async function assignConversation(formData: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const id = String(formData.get('id') || '');
  const assignedToId = String(formData.get('assignedToId') || '') || null;
  await prisma.conversation.update({ where: { id }, data: { assignedToId: assignedToId || null, assignedAt: assignedToId ? (new Date() as any) : null } });
  revalidatePath('/dashboard/admin/mensajeria');
  redirect(`/dashboard/admin/mensajeria?id=${id}`);
}

export async function setConversationStatus(formData: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || 'OPEN').toUpperCase();
  const allowed = ['OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED'];
  if (!allowed.includes(status)) return;
  const data: any = { status: status as any };
  if (status === 'RESOLVED' || status === 'CLOSED') data.closedAt = new Date() as any;
  await prisma.conversation.update({ where: { id }, data });
  revalidatePath('/dashboard/admin/mensajeria');
  redirect(`/dashboard/admin/mensajeria?id=${id}`);
}

export async function getAgents() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const agents = await prisma.user.findMany({ where: { role: { in: ['ADMIN','VENDEDOR'] as any } }, select: { id: true, name: true, email: true } });
  return agents as any;
}
