export async function sendAudioMessage(phone: string, audioUrl: string, caption?: string): Promise<{ ok: boolean; error?: string }>{
  try {
    const token = process.env.MANYCHAT_API_KEY || '';
    const base = process.env.MANYCHAT_BASE_URL || 'https://api.manychat.com';
    const path = process.env.MANYCHAT_SEND_PATH || '/whatsapp/sendMessage';
    if (!token) return { ok: false, error: 'ManyChat API not configured' };
    const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
    const payload: any = { to: phone.replace(/[^0-9]/g, ''), type: 'audio', audio: { link: audioUrl } };
    if (caption) payload.audio.caption = caption;
    const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { const txt = await res.text().catch(()=> ''); return { ok: false, error: `HTTP ${res.status} ${txt}` }; }
    return { ok: true };
  } catch (e: any) { return { ok: false, error: String(e) }; }
}
