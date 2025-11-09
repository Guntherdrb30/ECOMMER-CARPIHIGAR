// Bridge between Next API and MCP-style agent tools
export type AgentChunk = {
  type: 'text' | 'voice' | 'rich';
  message?: string;
  audioBase64?: string;
  products?: any[];
  cart?: any;
};

import * as Agent from '@/agents/carpihogar-customer-assistant';

export async function* sendMessage(params: { text: string; customerId?: string }): AsyncGenerator<AgentChunk> {
  const gen: any = (Agent as any).ConversationSendMessage?.sendMessage;
  if (typeof gen !== 'function') { yield { type: 'text', message: `Entendido: ${params.text}` }; return; }
  for await (const c of gen({ text: params.text, customerId: params.customerId })) yield c as AgentChunk;
}

export async function* processIncomingAudio(params: { audioBase64: string; customerId?: string }): AsyncGenerator<AgentChunk> {
  const gen: any = (Agent as any).ConversationProcessAudio?.processIncomingAudio;
  if (typeof gen !== 'function') { yield { type: 'text', message: 'He recibido tu audio.' }; return; }
  for await (const c of gen({ audioBase64: params.audioBase64, customerId: params.customerId })) yield c as AgentChunk;
}

export async function uiEvent(_body: any): Promise<{ ok: boolean }>{
  return { ok: true };
}
