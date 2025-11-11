async function run() {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const steps = [
    'Comprar grifería negra Tokio',
    '2',
    'Usar mi dirección principal',
  ];
  for (const m of steps) {
    const res = await fetch(`${base}/api/assistant/purchase`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: m }) });
    const json = await res.json();
    console.log('> ', m);
    console.log('< ', JSON.stringify(json));
  }
}
run();
