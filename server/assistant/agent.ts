// Bridge between Next API and MCP-style agent tools
export type AgentChunk = {
  type: 'text' | 'voice' | 'rich';
  message?: string;
  audioBase64?: string;
  products?: any[];
  cart?: any;
};

import * as ProductsSearch from '@/agents/carpihogar-ai-actions/tools/products/searchProducts';

export async function* sendMessage(params: { text: string; customerId?: string }): AsyncGenerator<AgentChunk> {
  const q = String(params.text || '').trim();
  if (!q) { yield { type: 'text', message: 'Â¿PodrÃ­as darme mÃ¡s detalles?' }; return; }
  const res = await ProductsSearch.run({ q });
  if (res?.success && Array.isArray(res.data) && res.data.length) {
    yield { type: 'text', message: 'Perfecto ðŸ¤ Ya lo tengo por aquÃ­. Te muestro opciones:' };
    // For compatibility with ChatWindow mapping
    yield { type: 'products', products: res.data } as any;
  } else {
    yield { type: 'text', message: 'No encontrÃ© coincidencias exactas. Â¿Me das alguna pista? (marca, tipo, color, medida)' };
  }
}

export async function* processIncomingAudio(_params: { audioBase64: string; customerId?: string }): AsyncGenerator<AgentChunk> {
  yield { type: 'text', message: 'Audio recibido. Â¿Deseas que busque un producto especÃ­fico?' };
}

export async function uiEvent(_body: any): Promise<{ ok: boolean }>{
  return { ok: true };
}

