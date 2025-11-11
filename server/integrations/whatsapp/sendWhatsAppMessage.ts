import { sendWhatsAppText } from '@/lib/whatsapp';

export async function sendWhatsAppMessage({ phone, text, buttons, template }: { phone: string; text: string; buttons?: Array<{ title: string; payload?: string }>; template?: string; }) {
  // Simple wrapper to underlying provider (ManyChat via lib/whatsapp)
  // Buttons/templates are placeholders for future ManyChat content types
  return sendWhatsAppText(phone, text);
}
