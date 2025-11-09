import { sendWhatsAppText } from '@/lib/whatsapp';

export async function sendWhatsappMessage(phone: string, text: string): Promise<{ ok: boolean; id?: string; error?: string }>{
  // Use ManyChat wrapper if configured; otherwise, console.log as placeholder
  try {
    if (process.env.MANYCHAT_API_KEY) {
      return await sendWhatsAppText(phone, text);
    }
    console.log('[WA placeholder]', { phone, text });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

