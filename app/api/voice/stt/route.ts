import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const ctype = req.headers.get('content-type') || '';
    if (!/multipart\/form-data/i.test(ctype)) return NextResponse.json({ error: 'content-type debe ser multipart/form-data' }, { status: 400 });
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'archivo requerido (file)' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'archivo demasiado grande (>5MB)' }, { status: 400 });
    const type = file.type || '';
    if (!/(audio|webm|wav|m4a)/i.test(type) && !/\.(webm|wav|m4a|ogg)$/i.test(file.name || '')) return NextResponse.json({ error: 'tipo de audio no soportado' }, { status: 400 });
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 });
    const buf = await file.arrayBuffer();
    const blob = new Blob([buf], { type: file.type || 'audio/webm' });
    const fd = new FormData();
    fd.append('file', new File([blob], file.name || 'audio.webm', { type: blob.type }));
    fd.append('model', 'whisper-1');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: fd as any,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return NextResponse.json({ error: `whisper error ${res.status}`, details: txt }, { status: 502 });
    }
    const json = await res.json();
    const text = json?.text || '';
    return NextResponse.json({ text: String(text || '').trim() });
  } catch (e: any) {
    return NextResponse.json({ error: 'error en STT' }, { status: 200 });
  }
}
