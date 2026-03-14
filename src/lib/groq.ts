export const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

type MessageContent = string | { type: 'image_url'; image_url: { url: string } }[];

export async function chatCompletion(
  messages: { role: 'user' | 'assistant' | 'system'; content: MessageContent }[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}
