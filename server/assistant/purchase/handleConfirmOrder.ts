import { verifyToken } from '@/server/integrations/whatsapp/verifyToken';

export async function handleConfirmOrder({ customerId, token }: { customerId: string; token: string }) {
  const r = await verifyToken(customerId, token);
  if (!r.ok) return { messages: [{ role: 'assistant', type: 'text', content: 'El código no es válido o expiró. ¿Deseas que lo reenviemos?' }] };
  return { messages: [{ role: 'assistant', type: 'text', content: '¡Listo! Orden confirmada. Te muestro métodos de pago.' }], uiActions: [{ type: 'ui_control', action: 'show_payment_form', payload: { orderId: r.orderId } }] };
}
