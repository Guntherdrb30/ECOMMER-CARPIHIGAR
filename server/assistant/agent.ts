// Skeleton MCP-like agent interface for Carpihogar
// Replace internals with actual MCP client wiring later

export type AgentChunk = {
  type: "text" | "voice" | "rich";
  message?: string;
  audioBase64?: string;
  products?: any[];
  cart?: any;
};

async function searchProducts(q: string): Promise<any[]> {
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_URL || ''}/api/products/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json().catch(() => []);
    return Array.isArray(j) ? j.slice(0, 5) : [];
  } catch { return []; }
}

export async function* sendMessage(text: string): AsyncGenerator<AgentChunk> {
  // Basic echo + product suggestions
  yield { type: 'text', message: `Entendido: ${text}` };
  const prods = await searchProducts(text);
  if (prods.length) yield { type: 'rich', message: 'Te recomiendo estos productos', products: prods };
}

export async function* processIncomingAudio(base64: string): AsyncGenerator<AgentChunk> {
  // Placeholder: no transcription here; simply acknowledge
  yield { type: 'text', message: 'Procesé tu audio. Estoy buscando opciones…' };
}

export async function uiEvent(body: any): Promise<{ ok: boolean }>{
  // TODO: route UI actions to MCP tools (addToCart, remove, checkout, etc.)
  return { ok: true };
}

