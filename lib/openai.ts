export type InvoiceLine = {
  code?: string | null;
  name: string;
  quantity: number;
  unitCost: number; // En moneda original, antes de conversión
  total?: number;
};

export type ParsedInvoice = {
  currency: 'USD' | 'VES';
  tasaVES?: number;
  lines: InvoiceLine[];
};

export async function callOpenAIResponses(payload: any): Promise<any | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
