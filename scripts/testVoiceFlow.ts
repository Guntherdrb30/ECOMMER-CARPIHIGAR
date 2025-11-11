import fs from 'node:fs/promises';

async function main() {
  const audio = await fs.readFile('test-audio.webm').catch(() => null);
  if (!audio) { console.log('Coloca un archivo test-audio.webm en el root'); return; }
  const fd = new FormData();
  fd.append('file', new File([audio], 'test-audio.webm', { type: 'audio/webm' }));
  const stt = await fetch('http://localhost:3000/api/voice/stt', { method: 'POST', body: fd as any });
  const sjson = await stt.json();
  const text = String(sjson?.text || '').trim();
  console.log('STT:', text);
  const tts = await fetch('http://localhost:3000/api/voice/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: 'sofia' }) });
  const ab = await tts.arrayBuffer();
  await fs.writeFile('tmp-reply.webm', Buffer.from(ab));
  console.log('Guardado tmp-reply.webm');
}

main();
