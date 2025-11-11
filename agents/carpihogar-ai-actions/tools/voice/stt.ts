export async function run(input: { audioUrl: string }) {
  const audioUrl = String(input?.audioUrl || '').trim();
  if (!audioUrl) return { success: false, message: 'audioUrl requerido', data: null };
  try {
    const res = await fetch(audioUrl);
    const buf = await res.arrayBuffer();
    const fd = new FormData();
    fd.append('file', new File([buf], 'audio.webm', { type: 'audio/webm' }));
    const stt = await fetch('/api/voice/stt', { method: 'POST', body: fd });
    const json = await stt.json();
    const text = String(json?.text || '').trim();
    return { success: true, message: 'OK', data: { text } };
  } catch (e: any) {
    return { success: false, message: 'STT error', data: null };
  }
}
