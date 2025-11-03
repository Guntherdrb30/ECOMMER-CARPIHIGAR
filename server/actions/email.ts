import prisma from '@/lib/prisma';
import { sendMail, basicTemplate } from '@/lib/mailer';

export async function sendWelcomeEmail(to: string, name?: string | null) {
  if (!to) return;
  const body = basicTemplate('Bienvenido', `<p>Hola ${name || ''},</p><p>¡Gracias por registrarte en Carpihogar.ai!</p><p>Ya puedes iniciar sesión y completar tu perfil.</p>`);
  await sendMail({ to, subject: '¡Bienvenido a Carpihogar!', html: body });
}

export async function sendAdminUserCreatedEmail(to: string, role: string) {
  if (!to) return;
  const body = basicTemplate('Cuenta creada', `<p>Se ha creado tu cuenta con rol <strong>${role}</strong>.</p><p>Puedes iniciar sesión en el panel.</p>`);
  await sendMail({ to, subject: `Tu usuario (${role}) ha sido creado`, html: body });
}

export async function sendQuoteCreatedEmail(quoteId: string) {
  const q = await prisma.quote.findUnique({ where: { id: quoteId }, include: { user: true, items: true } });
  if (!q?.user?.email) return;
  const items = (q.items || []).map((it) => `<li>${it.name} x ${it.quantity} — $ ${Number(it.priceUSD as any).toFixed(2)}</li>`).join('');
  const total = Number(q.totalUSD as any).toFixed(2);
  const body = basicTemplate('Presupuesto creado', `<p>Hola ${q.user?.name || ''},</p><p>Hemos generado tu presupuesto ${q.id.slice(0,8)}.</p><ul>${items}</ul><p><strong>Total USD:</strong> $ ${total}</p>`);
  await sendMail({ to: q.user.email, subject: `Tu presupuesto ${q.id.slice(0,8)}`, html: body });
}

export async function sendReceiptEmail(orderId: string, to: string, tipo: 'recibo'|'nota'|'factura' = 'recibo', moneda: 'USD'|'VES' = 'USD') {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: true, payment: true } });
    if (!order) return;
    const items = (order.items || []).map((it) => `<li>${it.name} x ${it.quantity} — $ ${Number(it.priceUSD as any).toFixed(2)}</li>`).join('');
    const total = Number(order.totalUSD as any).toFixed(2);
    const titulo = tipo === 'factura' ? 'Factura' : (tipo === 'nota' ? 'Nota de Entrega' : 'Recibo');
    const body = basicTemplate(`${titulo} de compra`, `<p>Gracias por tu compra ${order.user?.name || ''}.</p><p>Detalle de la orden ${order.id.slice(0,8)}:</p><ul>${items}</ul><p><strong>Total USD:</strong> $ ${total}</p>`);
    await sendMail({ to, subject: `${titulo} de tu compra ${order.id.slice(0,8)}`, html: body });
  } catch {}
}

