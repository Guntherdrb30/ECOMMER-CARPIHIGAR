import { prisma } from '../../lib/db';
import { log } from '../../lib/logger';

export async function run(input: { orderId: string; method: 'PAGO_MOVIL'|'TRANSFERENCIA'|'ZELLE'; currency?: 'USD'|'VES'; reference?: string; proofUrl?: string; payerName?: string; payerPhone?: string; payerBank?: string }) {
  try {
    const orderId = String(input?.orderId || '').trim();
    if (!orderId) return { success: false, message: 'orderId requerido', data: null };
    const method = String(input?.method || '').toUpperCase() as any;
    const currency = String(input?.currency || 'USD').toUpperCase() as any;
    const exists = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (!exists) return { success: false, message: 'Orden no encontrada', data: null };
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: { method, currency, reference: input?.reference || null as any, proofUrl: input?.proofUrl || null as any, status: 'EN_REVISION' as any, payerName: input?.payerName || null as any, payerPhone: input?.payerPhone || null as any, payerBank: input?.payerBank || null as any },
      create: { orderId, method, currency, reference: input?.reference || null as any, proofUrl: input?.proofUrl || null as any, status: 'EN_REVISION' as any, payerName: input?.payerName || null as any, payerPhone: input?.payerPhone || null as any, payerBank: input?.payerBank || null as any },
    });
    log('mcp.order.savePaymentProof', { orderId });
    return { success: true, message: 'Pago registrado para revisión', data: { orderId, paymentId: payment.id } };
  } catch (e: any) {
    return { success: false, message: 'No se pudo registrar el pago', data: null };
  }
}

