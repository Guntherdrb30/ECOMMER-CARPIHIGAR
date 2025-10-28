export async function sendWhatsAppText(toPhone: string, body: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const token = process.env.MANYCHAT_API_KEY;
    const base = process.env.MANYCHAT_BASE_URL || 'https://api.manychat.com';
    const path = process.env.MANYCHAT_SEND_PATH || '/whatsapp/sendMessage';
    if (!token) {
      return { ok: false, error: 'ManyChat API not configured' };
    }
    const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
    const payload = {
      to: toPhone.replace(/[^0-9]/g, ''),
      type: 'text',
      text: { body },
    } as any;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { ok: false, error: `ManyChat send failed: ${res.status} ${txt}` };
    }
    const json = await res.json().catch(() => ({}));
    const id = (json?.message_id || json?.id) as string | undefined;
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: String(e) };
  }
}

export async function sendWhatsAppMedia(toPhone: string, mediaUrl: string, type: 'image'|'video' = 'image', caption?: string): Promise<{ ok: boolean; id?: string; error?: string }>{
  try {
    const token = process.env.MANYCHAT_API_KEY;
    const base = process.env.MANYCHAT_BASE_URL || 'https://api.manychat.com';
    const path = process.env.MANYCHAT_SEND_PATH || '/whatsapp/sendMessage';
    if (!token) return { ok: false, error: 'ManyChat API not configured' };
    const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
    const payload: any = {
      to: toPhone.replace(/[^0-9]/g, ''),
      type,
    };
    if (type === 'image') payload.image = { link: mediaUrl, caption };
    else if (type === 'video') payload.video = { link: mediaUrl, caption };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { ok: false, error: `ManyChat send failed: ${res.status} ${txt}` };
    }
    const json = await res.json().catch(() => ({}));
    const id = (json?.message_id || json?.id) as string | undefined;
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: String(e) };
  }
}

export async function sendWhatsAppDocument(toPhone: string, documentUrl: string, filename?: string, caption?: string): Promise<{ ok: boolean; id?: string; error?: string }>{
  try {
    const token = process.env.MANYCHAT_API_KEY;
    const base = process.env.MANYCHAT_BASE_URL || 'https://api.manychat.com';
    const path = process.env.MANYCHAT_SEND_PATH || '/whatsapp/sendMessage';
    if (!token) return { ok: false, error: 'ManyChat API not configured' };
    const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
    const payload: any = {
      to: toPhone.replace(/[^0-9]/g, ''),
      type: 'document',
      document: { link: documentUrl },
    };
    if (filename) payload.document.filename = filename;
    if (caption) payload.document.caption = caption;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { ok: false, error: `ManyChat send failed: ${res.status} ${txt}` };
    }
    const json = await res.json().catch(() => ({}));
    const id = (json?.message_id || json?.id) as string | undefined;
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: String(e) };
  }
}
