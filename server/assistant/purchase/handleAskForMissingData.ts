export async function handleAskForMissingData({ missing }: { missing: { needQuantity?: boolean; needAddress?: boolean } }) {
  const messages: any[] = [];
  if (missing.needQuantity) messages.push({ role: 'assistant', type: 'text', content: '¿Cuántas unidades deseas?' });
  if (missing.needAddress) messages.push({ role: 'assistant', type: 'text', content: '¿A qué dirección lo enviamos?' });
  return { messages };
}
