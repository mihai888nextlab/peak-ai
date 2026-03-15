const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

type MessageContent = string | { type: 'image_url'; image_url: { url: string } }[];

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
  };
}

export async function chatCompletion(
  messages: { role: 'user' | 'assistant' | 'system'; content: MessageContent }[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    tools?: ToolDefinition[];
  }
) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const body: any = {
    model: MODEL,
    messages: messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1024,
  };

  if (options?.tools && options.tools.length > 0) {
    body.tools = options.tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        const errorText = await response.text();
        const match = errorText.match(/Please try again in ([\d.]+)s/);
        const waitTime = match ? parseFloat(match[1]) * 1000 : 5000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid Groq response: no choices');
      }

      const message = data.choices[0].message;

      if (message.tool_calls && message.tool_calls.length > 0) {
        return {
          content: message.content || '',
          toolCalls: message.tool_calls.map((tc: any) => {
            let args = {};
            try {
              args = JSON.parse(tc.function.arguments || '{}');
            } catch (e) {
              console.error('[Groq] Failed to parse function arguments:', tc.function.arguments);
            }
            return {
              name: tc.function.name,
              arguments: args,
            };
          }),
        };
      }

      return message.content || '';
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        console.log('Rate limit hit, retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      console.error('[Groq] Error:', error);
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
