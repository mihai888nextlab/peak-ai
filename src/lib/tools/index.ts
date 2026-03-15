import { TOOL_DEFINITIONS, TOOL_NAMES } from './definitions';
import { TOOL_FUNCTIONS } from './implementations';
import { chatCompletion } from '@/lib/groq';
import { AgentType } from '@/lib/agents';

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const SYSTEM_PROMPT = `You are Coach PEAK, an elite athletic AI assistant.

You help with training, nutrition, recovery, and health.`;

const AGENT_PROMPTS: Record<AgentType, string> = {
  coach: SYSTEM_PROMPT,
  nutritionist: `You are Chef PEAK, a sports nutritionist. Help with meal planning and diet.`,
  psychologist: `You are Dr. MIND, a sports psychologist. Listen and help with mental health.`,
  kinetotherapist: `You are Dr. PHYSIO, a kinetotherapist. Help with injury recovery and rehabilitation.`,
};

export async function executeWithTools(
  messages: { role: string; content: string }[],
  maxIterations: number = 5,
  agent?: AgentType
): Promise<string> {
  const systemPrompt = agent && AGENT_PROMPTS[agent] ? AGENT_PROMPTS[agent] : SYSTEM_PROMPT;
  
  const conversation: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ 
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant', 
      content: m.content 
    })),
  ];

  console.log('[Coach] Agent:', agent, 'Messages:', conversation.length);

  for (let i = 0; i < maxIterations; i++) {
    try {
      const result = await chatCompletion(conversation, {
        temperature: 0.7,
        maxTokens: 1200,
        tools: TOOL_DEFINITIONS,
      });

      if (typeof result === 'string') {
        console.log('[Coach] Direct response');
        return result;
      }

      const { content, toolCalls } = result;
      
      console.log('[Coach] Tool calls:', toolCalls?.length || 0);

      if (!toolCalls || toolCalls.length === 0) {
        return content || '';
      }

      if (content) {
        conversation.push({ role: 'assistant', content });
      }

      for (const call of toolCalls) {
        console.log('[Coach] Executing:', call.name);
        const fn = TOOL_FUNCTIONS[call.name];
        if (fn) {
          const fnResult = await fn(call.arguments);
          console.log('[Coach] Result:', JSON.stringify(fnResult).substring(0, 100));
          conversation.push({
            role: 'user',
            content: JSON.stringify(fnResult),
          });
        } else {
          console.log('[Coach] Tool not found:', call.name);
          conversation.push({
            role: 'user',
            content: JSON.stringify({ error: 'Tool not found' }),
          });
        }
      }
      continue;
    } catch (error) {
      console.error('[Coach] Error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  return "I've been thinking about this. Could you try asking again?";
}

export function getToolDefinitionsForLLM() {
  return TOOL_DEFINITIONS;
}
