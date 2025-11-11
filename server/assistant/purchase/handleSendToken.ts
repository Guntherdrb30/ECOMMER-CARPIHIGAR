import prisma from '@/lib/prisma';
import { sendVerificationToken } from '@/server/integrations/whatsapp/sendVerificationToken';

export async function handleSendToken({ customerId, orderTempId }: { customerId: string; orderTempId: string }) {
  const user = await prisma.user.findUnique({ where: { id: customerId } });
  const phone = String((user as any)?.phone || '').trim();
  if (!phone) return { messages: [{ role: 'assistant', type: 'text', content: 'No tengo tu teléfono registrado para enviarte el código.' }] };
  await sendVerificationToken(customerId, phone, orderTempId);
  return { messages: [{ role: 'assistant', type: 'text', content: 'Te envié un código por WhatsApp. Escríbelo aquí o respóndelo en WhatsApp.' }] };
}
