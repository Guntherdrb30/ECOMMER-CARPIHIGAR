import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session || !((session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'VENDEDOR' || (session.user as any)?.role === 'ALIADO')) {
    return new NextResponse('Not authorized', { status: 401 });
  }
  const quote = await prisma.quote.findUnique({ where: { id }, include: { user: true, items: true } });
  if (!quote) return new NextResponse('Not found', { status: 404 });
  if ((session.user as any)?.role === 'ALIADO' && String(quote.sellerId || '') !== String((session.user as any)?.id || '')) {
    return new NextResponse('Not authorized', { status: 401 });
  }

  // Update status to ENVIADO
  await prisma.quote.update({ where: { id }, data: { status: 'ENVIADO' as any } });
  try { await prisma.auditLog.create({ data: { userId: (session.user as any)?.id, action: 'QUOTE_SEND_WA', details: id } }); } catch {}

  const text = `Presupuesto ${quote.id}\nCliente: ${quote.user?.name || quote.user?.email}\nTotal: $${Number(quote.totalUSD).toFixed(2)}\nItems:\n` +
    quote.items.map((it:any)=>`- ${it.name} · ${it.quantity} x $${Number(it.priceUSD).toFixed(2)}`).join('\n');
  const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  return NextResponse.redirect(wa);
}
