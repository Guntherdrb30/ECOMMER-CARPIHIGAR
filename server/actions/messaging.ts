'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendWhatsAppText, sendWhatsAppMedia } from '@/lib/whatsapp';
import { redirect } from 'next/navigation';

export async function getConversations(params?: { status?: 'OPEN'|'IN_PROGRESS'|'PENDING'|'RESOLVED'|'CLOSED'|string; mine?: boolean; unassigned?: boolean; q?: string }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const where: any = {};
  if (params?.status) where.status = params.status as any;
  if (params?.mine) where.assignedToId = (session?.user as any)?.id;
  if (params?.unassigned) where.assignedToId = null as any;
  if (params?.q) {
    const q = String(params.q).trim();
    const digits = q.replace(/[^0-9]/g, '');
    const or: any[] = [];
    if (q) {
      or.push({ user: { is: { name: { contains: q, mode: 'insensitive' } } } });
      or.push({ user: { is: { email: { contains: q, mode: 'insensitive' } } } });
      or.push({ phone: { contains: digits || q, mode: 'insensitive' } });
    }
    if (or.length) {
      (where.AND ||= []).push({ OR: or });
    }
  }
  try {
    const convos = await prisma.conversation.findMany({ where, orderBy: { lastMessageAt: 'desc' }, include: { user: true, assignedTo: true }, take: 200 });
    return convos as any;
  } catch (err) {
    console.warn('[getConversations] DB error', err);
    return [] as any[];
  }
}

export async function getConversationWithMessages(id: string) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  try {
    const convo = await prisma.conversation.findUnique({ where: { id }, include: { user: true, assignedTo: true } });
    if (!convo) return null as any;
    const messages = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 500 });
    try { await prisma.conversation.update({ where: { id }, data: { unreadAgent: 0 } }); } catch {}
    return { convo, messages } as any;
  } catch (err) {
    console.warn('[getConversationWithMessages] DB error', err);
    return null as any;
  }
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

// Wrapper tolerante a errores para evitar que una excepción del servidor
// rompa la renderización de la página cuando se envía un mensaje.
export async function sendMessageActionSafe(_prev: any, form: FormData) {
  try {
    return await sendMessageAction(_prev, form);
  } catch (e: any) {
    console.error('[sendMessageActionSafe] error', e);
    try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
    return { ok: false, error: String(e?.message || e) } as any;
  }
}

export async function ingestInboundMessage(phone: string, text: string, waMessageId?: string) {
  const convo = await ensureConversation(phone, undefined);
  await prisma.message.create({ data: { conversationId: convo.id, direction: 'IN' as any, status: 'DELIVERED' as any, type: 'TEXT', text, waMessageId } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastInboundAt: new Date(), unreadAgent: { increment: 1 } as any } });
  try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
  return { ok: true } as any;
}

export async function sendBulkMessageAction(_prev: any, form: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) return { ok: false, error: 'Not authorized' };
  const rawPhones = String(form.get('phones') || '').trim();
  const text = String(form.get('text') || '').trim();
  if (!rawPhones || !text) return { ok: false, error: 'Faltan teléfonos o texto' };
  const tokens = rawPhones.split(/[\s,;\n]+/g).map(v => v.trim()).filter(Boolean);
  const uniquePhones = Array.from(new Set(tokens.map(v => v.replace(/[^0-9]/g, '')))).filter(v => v.length >= 8);
  const results: { phone: string; ok: boolean; error?: string }[] = [];
  for (const p of uniquePhones) {
    try {
      const convo = await ensureConversation(p, undefined);
      const res = await sendWhatsAppText(p, text);
      await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUT' as any, status: res.ok ? ('SENT' as any) : ('FAILED' as any), type: 'TEXT', text, waMessageId: res.id } });
      await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastOutboundAt: new Date(), unreadCustomer: { increment: 1 } as any } });
      results.push({ phone: p, ok: res.ok, error: res.ok ? undefined : res.error });
    } catch (e: any) {
      results.push({ phone: p, ok: false, error: String(e?.message || e) });
    }
  }
  try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
  const failed = results.filter(r => !r.ok).length;
  return { ok: failed === 0, results } as any;
}

export async function sendDirectMessageAction(_prev: any, form: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) return { ok: false, error: 'Not authorized' };
  const userId = String(form.get('userId') || '').trim();
  const text = String(form.get('text') || '').trim();
  if (!userId || !text) return { ok: false, error: 'Faltan usuario o texto' };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const phone = (user?.phone || '').replace(/[^0-9]/g, '');
  if (!user || !phone) return { ok: false, error: 'El usuario no tiene teléfono' };
  const convo = await ensureConversation(phone, user.id);
  const res = await sendWhatsAppText(phone, text);
  await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUT' as any, status: res.ok ? ('SENT' as any) : ('FAILED' as any), type: 'TEXT', text, waMessageId: res.id } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastOutboundAt: new Date(), unreadCustomer: { increment: 1 } as any } });
  try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function searchUsersForCampaign(q: string) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const term = String(q || '').trim();
  if (!term) return [] as any[];
  const digits = term.replace(/[^0-9]/g, '');
  const where: any = { OR: [] };
  where.OR.push({ name: { contains: term, mode: 'insensitive' } });
  where.OR.push({ email: { contains: term, mode: 'insensitive' } });
  if (digits) where.OR.push({ phone: { contains: digits, mode: 'insensitive' } });
  const users = await prisma.user.findMany({ where, select: { id: true, name: true, email: true, phone: true }, take: 20 });
  return users as any;
}

export async function saveConversationAsCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const id = String(formData.get('id') || '');
  if (!id) return;
  const convo = await prisma.conversation.findUnique({ where: { id } });
  if (!convo) return;
  const phone = (convo.phone || '').replace(/[^0-9]/g, '');
  if (!phone) return;
  let user = await prisma.user.findFirst({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({ data: { email: `wa_${phone}@carpihogar.ai`, password: '!', role: 'CLIENTE' as any, phone, name: undefined } as any });
  }
  await prisma.conversation.update({ where: { id }, data: { userId: user.id } });
  try { revalidatePath('/dashboard/admin/mensajeria'); } catch {}
}

export async function assignConversation(formData: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  const id = String(formData.get('id') || '');
  const assignedToId = String(formData.get('assignedToId') || '') || null;
  await prisma.conversation.update({ where: { id }, data: { assignedToId: assignedToId || null, assignedAt: assignedToId ? (new Date() as any) : null } });
  revalidatePath('/dashboard/admin/mensajeria');
  const q = String(formData.get('q') || '');
  const status = String(formData.get('status') || '');
  const mine = String(formData.get('mine') || '');
  const unassigned = String(formData.get('unassigned') || '');
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (mine) params.set('mine', '1');
  if (unassigned) params.set('unassigned', '1');
  if (q) params.set('q', q);
  params.set('id', id);
  redirect(`/dashboard/admin/mensajeria?${params.toString()}`);
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
  const q = String(formData.get('q') || '');
  const statusFilter = String(formData.get('status') || '');
  const mine = String(formData.get('mine') || '');
  const unassigned = String(formData.get('unassigned') || '');
  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (mine) params.set('mine', '1');
  if (unassigned) params.set('unassigned', '1');
  if (q) params.set('q', q);
  params.set('id', id);
  redirect(`/dashboard/admin/mensajeria?${params.toString()}`);
}

export async function getConversationStats() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  try {
    const statuses = ['OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED'] as const;
    const counts: Record<string, number> = {};
    for (const s of statuses) {
      counts[s] = await prisma.conversation.count({ where: { status: s as any } });
    }
    const unassigned = await prisma.conversation.count({ where: { assignedToId: null as any } });
    const mine = await prisma.conversation.count({ where: { assignedToId: (session?.user as any)?.id } });
    const unread = await prisma.conversation.aggregate({ _sum: { unreadAgent: true } });
    return { counts, unassigned, mine, unread: Number((unread as any)?._sum?.unreadAgent || 0) } as any;
  } catch (err) {
    console.warn('[getConversationStats] DB error', err);
    const counts = { OPEN: 0, IN_PROGRESS: 0, PENDING: 0, RESOLVED: 0, CLOSED: 0 } as any;
    return { counts, unassigned: 0, mine: 0, unread: 0 } as any;
  }
}

export async function getAgents() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) throw new Error('Not authorized');
  try {
    const agents = await prisma.user.findMany({ where: { role: { in: ['ADMIN','VENDEDOR'] as any } }, select: { id: true, name: true, email: true } });
    return agents as any;
  } catch (err) {
    console.warn('[getAgents] DB error', err);
    return [] as any[];
  }
}

// Envío masivo avanzado: soporta texto, media y producto (link)
export async function sendBulkAdvancedAction(_prev: any, form: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) return { ok: false, error: 'Not authorized' };
  const rawPhones = String(form.get('phones') || '').trim();
  const text = String(form.get('text') || '').trim();
  const mediaUrl = String(form.get('mediaUrl') || '').trim();
  const mediaType = (String(form.get('mediaType') || 'image').toLowerCase() === 'video') ? 'video' : 'image';
  const productUrl = String(form.get('productUrl') || '').trim();
  if (!rawPhones) return { ok: false, error: 'Faltan teléfonos' };
  const tokens = rawPhones.split(/[\s,;\n]+/g).map(v => v.trim()).filter(Boolean);
  const uniquePhones = Array.from(new Set(tokens.map(v => v.replace(/[^0-9]/g, '')))).filter(v => v.length >= 8);
  const results: { phone: string; ok: boolean; error?: string }[] = [];
  for (const p of uniquePhones) {
    try {
      const convo = await ensureConversation(p, undefined);
      let res: any = { ok: true };
      if (mediaUrl) {
        res = await sendWhatsAppMedia(p, mediaUrl, mediaType as any, text || undefined);
        await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUT' as any, status: res.ok ? ('SENT' as any) : ('FAILED' as any), type: mediaType === 'video' ? 'VIDEO' : 'IMAGE', text: text || undefined, mediaUrl, waMessageId: res.id } });
      } else {
        const merged = productUrl ? `${text ? text + '\n' : ''}${productUrl}` : (text || '(sin texto)');
        res = await sendWhatsAppText(p, merged);
        await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUT' as any, status: res.ok ? ('SENT' as any) : ('FAILED' as any), type: 'TEXT', text: merged, waMessageId: res.id } });
      }
      await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastOutboundAt: new Date(), unreadCustomer: { increment: 1 } as any } });
      results.push({ phone: p, ok: res.ok, error: res.ok ? undefined : res.error });
    } catch (e: any) {
      results.push({ phone: p, ok: false, error: String(e?.message || e) });
    }
  }
  try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
  const failed = results.filter(r => !r.ok).length;
  return { ok: failed === 0, results } as any;
}

export async function sendAttachmentAction(_prev: any, form: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) return { ok: false, error: 'Not authorized' };
  const toPhone = String(form.get('toPhone') || '');
  const mediaUrl = String(form.get('mediaUrl') || '').trim();
  const mediaType = (String(form.get('mediaType') || 'image').toLowerCase() === 'video') ? 'video' : 'image';
  const caption = String(form.get('caption') || '').trim() || undefined;
  if (!toPhone || !mediaUrl) return { ok: false, error: 'Faltan teléfono o media' };
  const convo = await ensureConversation(toPhone, undefined);
  const res = await sendWhatsAppMedia(toPhone, mediaUrl, mediaType as any, caption);
  await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUT' as any, status: res.ok ? ('SENT' as any) : ('FAILED' as any), type: mediaType === 'video' ? 'VIDEO' : 'IMAGE', text: caption, mediaUrl, waMessageId: res.id } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastOutboundAt: new Date(), unreadCustomer: { increment: 1 } as any } });
  try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function sendProductLinkAction(_prev: any, form: FormData) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) return { ok: false, error: 'Not authorized' };
  const toPhone = String(form.get('toPhone') || '');
  const productUrl = String(form.get('productUrl') || '').trim();
  const text = String(form.get('text') || '').trim();
  if (!toPhone || !productUrl) return { ok: false, error: 'Faltan teléfono o producto' };
  const message = `${text ? text + '\n' : ''}${productUrl}`;
  const convo = await ensureConversation(toPhone, undefined);
  const res = await sendWhatsAppText(toPhone, message);
  await prisma.message.create({ data: { conversationId: convo.id, direction: 'OUT' as any, status: res.ok ? ('SENT' as any) : ('FAILED' as any), type: 'TEXT', text: message, waMessageId: res.id } });
  await prisma.conversation.update({ where: { id: convo.id }, data: { lastMessageAt: new Date(), lastOutboundAt: new Date(), unreadCustomer: { increment: 1 } as any } });
  try { revalidatePath('/dashboard/admin/mensajeria', 'page' as any); } catch {}
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
