export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export type ParsedInvoice = {
  currency: "USD" | "VES";
  tasaVES?: number;
  lines: Array<{
    code?: string | null;
    name: string;
    quantity: number;
    unitCost: number;
    total?: number;
  }>;
};

/**
 * Obtiene una respuesta de Chat Completion de OpenAI.
 * @param messages El historial de mensajes de la conversación.
 * @returns El mensaje de respuesta del asistente.
 */
export async function getOpenAIChatCompletion(
  messages: Message[],
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY no está configurada.");
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // O el modelo que prefieras
        messages,
      }),
    });

    if (!res.ok) {
      console.error(
        "Error en la respuesta de la API de OpenAI:",
        res.status,
        res.statusText,
      );
      const errorBody = await res.json();
      console.error("Detalles del error:", errorBody);
      return null;
    }

    const data = await res.json();
    const responseMessage = data.choices[0]?.message?.content;
    return responseMessage ?? null;
  } catch (error) {
    console.error("Error al llamar a la API de OpenAI:", error);
    return null;
  }
}

type ResponsesPayload = {
  model: string;
  input: any;
  response_format?: any;
  temperature?: number;
};

/**
 * Wrapper simple para el endpoint `/v1/responses` (Structured Outputs).
 */
export async function callOpenAIResponses(payload: ResponsesPayload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no está configurada");
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: payload.model,
      input: payload.input,
      response_format: payload.response_format,
      temperature: payload.temperature ?? 0,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `OpenAI responses error: ${res.status} ${res.statusText} ${body}`,
    );
  }

  return res.json();
}

