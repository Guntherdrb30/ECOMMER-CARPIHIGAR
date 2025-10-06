'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendWhatsAppText } from '@/lib/whatsapp';

export async function getConversations() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const convos = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: 'desc' },
    include: { user: true },
    take: 100,
  });
  return convos as any;
}

export async function getConversationWithMessages(id: string) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const convo = await prisma.conversation.findUnique({ where: { id }, include: { user: true } });
  if (!convo) throw new Error('Conversation not found');
  const messages = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 500 });
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
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date() } });
  revalidatePath('/dashboard/admin/mensajeria', 'page' as any);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function ingestInboundMessage(phone: string, text: string, waMessageId?: string) {
  const convo = await ensureConversation(phone, undefined);
  await prisma.message.create({ data: { conversationId: convo.id, direction: 'IN' as any, status: 'DELIVERED' as any, type: 'TEXT', text, waMessageId } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date() } });
  try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
  return { ok: true } as any;
}

