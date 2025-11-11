import { log } from '../../lib/logger';

export async function run(input: { to: string; text: string }) {
  const to = String(input?.to || '').trim();
  const text = String(input?.text || '').trim();
  if (!to || !text) return { success: false, message: 'to y text requeridos', data: null };
  // Placeholder – wire to your WhatsApp provider using WHATSAPP_API_URL / WHATSAPP_API_KEY
  log('mcp.whatsapp.send', { to, preview: text.slice(0, 40) + (text.length > 40 ? '…' : '') });
  return { success: true, message: 'Mensaje enviado (placeholder)', data: { to } };
}

