// Bridge between Next API and MCP-style agent tools
export type AgentChunk = {
  type: 'text' | 'voice' | 'rich';
  message?: string;
  audioBase64?: string;
  products?: any[];
  cart?: any;
};

import * as Agent from '@/agents/carpihogar-customer-assistant';

export async function* sendMessage(text: string): AsyncGenerator<AgentChunk> {
  const gen: any = (Agent as any).ConversationSendMessage?.sendMessage;
  if (typeof gen !== 'function') { yield { type: 'text', message: `Entendido: ${text}` }; return; }
  for await (const c of gen({ text })) yield c as AgentChunk;
}

export async function* processIncomingAudio(base64: string): AsyncGenerator<AgentChunk> {
  const gen: any = (Agent as any).ConversationProcessAudio?.processIncomingAudio;
  if (typeof gen !== 'function') { yield { type: 'text', message: 'He recibido tu audio.' }; return; }
  for await (const c of gen({ audioBase64: base64 })) yield c as AgentChunk;
}

export async function uiEvent(_body: any): Promise<{ ok: boolean }>{
  return { ok: true };
}
