export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Obtiene una respuesta de Chat Completion de OpenAI.
 * @param messages El historial de mensajes de la conversación.
 * @returns El mensaje de respuesta del asistente.
 */
export async function getOpenAIChatCompletion(
  messages: Message[]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY no está configurada.');
    return null;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // O el modelo que prefieras
        messages,
      }),
    });

    if (!res.ok) {
      console.error('Error en la respuesta de la API de OpenAI:', res.status, res.statusText);
      const errorBody = await res.json();
      console.error('Detalles del error:', errorBody);
      return null;
    }

    const data = await res.json();
    const responseMessage = data.choices[0]?.message?.content;
    return responseMessage ?? null;
  } catch (error) {
    console.error('Error al llamar a la API de OpenAI:', error);
    return null;
  }
}