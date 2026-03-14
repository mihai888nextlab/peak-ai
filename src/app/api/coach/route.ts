import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeWithTools, getToolDefinitionsForLLM } from '@/lib/tools';
import { AgentType } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, agent } = body;

    console.log('[CoachAPI] Messages:', messages?.length, 'Agent:', agent);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const conversationMessages = messages
      .filter((m: any) => m.content || m.text)
      .map((m: any) => ({
        role: m.role || (m.from === 'peak' ? 'assistant' : 'user'),
        content: m.content || m.text || '',
      }));

    if (conversationMessages.length === 0) {
      return NextResponse.json({ error: 'No message content' }, { status: 400 });
    }

    const agentType = (agent || 'coach') as AgentType;
    const response = await executeWithTools(conversationMessages, 5, agentType);

    return NextResponse.json({ 
      response,
    });
  } catch (error) {
    console.error('[CoachAPI] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    tools: getToolDefinitionsForLLM(),
  });
}
