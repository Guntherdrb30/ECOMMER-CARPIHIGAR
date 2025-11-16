import 'dotenv/config';

async function main() {
  const base =
    (process.env.NEXT_PUBLIC_URL || '').trim() ||
    (process.env.NEXTAUTH_URL || '').trim() ||
    'http://localhost:3000';

  const url = new URL('/api/assistant/text', base).toString();
  const query = process.argv.slice(2).join(' ') || 'bisagras samet';

  console.log('Haciendo POST a:', url);
  console.log('Consulta:', query);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: query }),
  });

  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));

  const body = res.body;
  if (!body) {
    const text = await res.text().catch(() => '');
    console.log('Respuesta JSON/text:', text);
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  console.log('Streaming chunks:');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const raw of parts) {
      const t = raw.trim();
      if (!t) continue;
      console.log('  Chunk:', t);
      try {
        const parsed = JSON.parse(t);
        console.log('    Parsed:', parsed);
      } catch {
        // Si no es JSON válido, igual lo mostramos en crudo
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

