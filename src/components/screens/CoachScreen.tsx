'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Message, READINESS } from '@/lib/data';
import { PulseDot, Card } from '../ui';
import { FiActivity, FiCoffee, FiZap, FiHeart, FiAlertCircle } from 'react-icons/fi';
import { AgentType, AGENTS } from '@/lib/agents';

const AGENT_ICONS: Record<AgentType, React.ComponentType<any>> = {
  coach: FiActivity,
  psychologist: FiHeart,
  nutritionist: FiCoffee,
  kinetotherapist: FiAlertCircle,
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RedirectAction {
  type: 'workout' | 'meal';
  id: string;
}

function parseMarkdown(text: string): { html: string; redirect?: RedirectAction } {
  const redirectMatch = text.match(/\[\[REDIRECT:(\w+):([^\]]+)\]\]/);
  let redirect: RedirectAction | undefined;
  let cleanText = text;
  
  if (redirectMatch) {
    redirect = { type: redirectMatch[1] as 'workout' | 'meal', id: redirectMatch[2] };
    cleanText = text.replace(/\[\[REDIRECT:\w+:[^\]]+\]\]/g, '');
  }
  
  const html = cleanText
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/## (.+)/g, '<div style="font-size:16px;font-weight:600;margin:12px 0 6px">$1</div>')
    .replace(/- (.+)/g, '<div style="margin-left:12px;margin-bottom:4px">• $1</div>')
    .replace(/\n/g, '<br/>');
    
  return { html, redirect };
}

interface UserGoals {
  dailyCalorieGoal: number;
  goalType: 'maintain' | 'bulk' | 'cut';
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

interface Props {
  goals?: UserGoals | null;
}

let idCounter = 100;
const genId = () => String(++idCounter);
const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const INITIAL_MESSAGES: Record<AgentType, string> = {
  coach: "Hey! I'm **Coach PEAK** — your AI athletic coach. I can help with training, nutrition, recovery, and more. What do you need?",
  psychologist: "Hello! I'm **Dr. MIND** — your sports psychologist. How are you feeling today?",
  nutritionist: "Hi! I'm **Chef PEAK** — your nutrition coach. Ready to optimize your diet for peak performance?",
  kinetotherapist: "Hello! I'm **Dr. PHYSIO** — your rehabilitation specialist. Got any injuries or pain to discuss?",
};

const QUICK_ACTIONS: Record<AgentType, { label: string; icon: React.ComponentType<any> }[]> = {
  coach: [
    { label: 'How should I train today?', icon: FiActivity },
    { label: "What's my readiness?", icon: FiZap },
    { label: 'Upper body tips', icon: FiActivity },
  ],
  psychologist: [
    { label: "I'm feeling stressed", icon: FiHeart },
    { label: 'Help with motivation', icon: FiZap },
    { label: 'Pre-competition anxiety', icon: FiAlertCircle },
  ],
  nutritionist: [
    { label: 'What should I eat today?', icon: FiCoffee },
    { label: 'Pre-workout meal', icon: FiActivity },
    { label: 'Protein target check', icon: FiZap },
  ],
  kinetotherapist: [
    { label: 'I have knee pain', icon: FiAlertCircle },
    { label: 'Stretching routine', icon: FiActivity },
    { label: 'Return to training', icon: FiZap },
  ],
};

function makeInitialMessage(agent: AgentType): Message {
  const { html } = parseMarkdown(INITIAL_MESSAGES[agent]);
  return {
    id: '1',
    from: 'peak',
    text: html,
    time: nowTime(),
    showWave: true,
  };
}

export default function CoachScreen({ goals }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(() => {
    const stored = sessionStorage.getItem('selectedAgent') as AgentType | null;
    return stored && AGENTS[stored] ? stored : 'coach';
  });
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = sessionStorage.getItem('coachMessages');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Message[];
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    return [makeInitialMessage('coach')];
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isSending = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isSending.current) {
      sessionStorage.setItem('coachMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem('selectedAgent', selectedAgent);
  }, [selectedAgent]);

  useEffect(() => {
    const storedAgent = sessionStorage.getItem('selectedAgent') as AgentType | null;
    const storedMessages = sessionStorage.getItem('coachMessages');

    const agent = storedAgent && AGENTS[storedAgent] ? storedAgent : 'coach';
    setSelectedAgent(agent);

    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages) as Message[];
        if (parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch {}
    }
    setMessages([makeInitialMessage(agent)]);
  }, []);

  useEffect(() => {
    if (!isSending.current) {
      sessionStorage.setItem('coachMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleAgentChange = useCallback((agent: AgentType) => {
    if (agent === selectedAgent) {
      sessionStorage.setItem('selectedAgent', agent);
      return;
    }

    setSelectedAgent(agent);
    sessionStorage.setItem('selectedAgent', agent);
    const fresh = [makeInitialMessage(agent)];
    setMessages(fresh);
    sessionStorage.setItem('coachMessages', JSON.stringify(fresh));
  }, [selectedAgent]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending.current) return;
    isSending.current = true;

    const userMessage: Message = {
      id: genId(),
      from: 'user',
      text: text.trim(),
      time: nowTime(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const pendingMsg = sessionStorage.getItem('coachPendingMessage');
    if (pendingMsg) {
      sessionStorage.removeItem('coachPendingMessage');
    }

    try {
      const currentMessages = [...messages, userMessage];
      const chatHistory: ChatMessage[] = currentMessages.map(m => ({
        role: m.from === 'peak' ? 'assistant' as const : 'user' as const,
        content: (m.text || '').replace(/<[^>]+>/g, ''),
      }));

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          goals,
          agent: selectedAgent,
        }),
      });

      const data = await res.json();
      const { html, redirect } = data.response ? parseMarkdown(data.response) : { html: 'Sorry, I hit a snag. Try again.', redirect: undefined };

      const aiMessage: Message = {
        id: genId(),
        from: 'peak',
        text: html,
        time: nowTime(),
        redirect,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Coach error:', err);
      setMessages(prev => [...prev, {
        id: genId(),
        from: 'peak',
        text: 'Connection issue. Check your API key.',
        time: nowTime(),
      }]);
    } finally {
      isSending.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (e: Event) => {
      const message = (e as CustomEvent<string>).detail;
      handleSendMessage(message);
    };
    const handleAgentChanged = (e: Event) => {
      handleAgentChange((e as CustomEvent<AgentType>).detail);
    };
    window.addEventListener('coachMessage', handleMessage as EventListener);
    window.addEventListener('agentChanged', handleAgentChanged as EventListener);
    return () => {
      window.removeEventListener('coachMessage', handleMessage as EventListener);
      window.removeEventListener('agentChanged', handleAgentChanged as EventListener);
    };
  }, [handleAgentChange, messages, selectedAgent, goals]);

  const AgentIcon = AGENT_ICONS[selectedAgent];
  const agentColor = AGENTS[selectedAgent].color;
  const agentName = AGENTS[selectedAgent].name;

  // ─── JSX ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: '100%', overflow: 'hidden' }}>

      {/* ── LEFT COLUMN: header + messages + input ── */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', height: '100%', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
          flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: agentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${agentColor}40`,
          }}>
            <AgentIcon size={22} color="#000" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{agentName} PEAK</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <PulseDot size={6} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: agentColor, letterSpacing: '0.05em' }}>
                Online · Groq AI
              </span>
            </div>
          </div>
        </div>

        {/* Messages — scrollable, flex:1 */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 24px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            minHeight: 0, // ← critical: allows flex child to shrink below content size
          }}
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              {msg.from === 'peak' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: agentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AgentIcon size={14} color="#000" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{agentName} PEAK</span>
                </div>
              )}

              <div style={{
                padding: msg.from === 'user' ? '12px 16px' : '16px 20px',
                borderRadius: msg.from === 'user' ? '20px 20px 8px 20px' : '20px 20px 20px 8px',
                background: msg.from === 'user' ? 'var(--accent)' : 'var(--card)',
                color: msg.from === 'user' ? '#000' : 'var(--text)',
                fontSize: 14, lineHeight: 1.6,
                border: '1px solid',
                borderColor: msg.from === 'peak' ? 'var(--border)' : 'transparent',
                boxShadow: msg.from === 'user' ? '0 4px 12px rgba(200,255,0,0.15)' : 'none',
              }}>
                <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                {msg.redirect && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'train' }))}
                    style={{
                      marginTop: 12,
                      padding: '8px 16px',
                      background: agentColor,
                      border: 'none',
                      borderRadius: 8,
                      color: '#000',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Go to Training →
                  </button>
                )}
              </div>

              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--muted)', marginTop: 4,
                alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.time}
              </span>
            </div>
          ))}

          {/* Loading indicator — always at the END of the message list */}
          {isLoading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: 'flex-start',
              maxWidth: '80%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: agentColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AgentIcon size={14} color="#000" />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{agentName} PEAK</span>
              </div>
              <div style={{
                padding: '14px 18px',
                borderRadius: '20px 20px 20px 8px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--muted)',
                      display: 'inline-block',
                      animation: 'typingBounce 1s ease-in-out infinite',
                      animationDelay: `${delay}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>{/* ── END LEFT COLUMN ── */}

      {/* ── RIGHT COLUMN: stats + quick actions ── */}
      <div style={{ overflowY: 'auto', height: '100%', padding: 20, background: 'var(--surface)' }}>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
        }}>
          Quick Stats
        </div>

        <Card style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Readiness</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)' }}>{READINESS.score}</span>
          </div>
          <div style={{ height: 4, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${READINESS.score}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
          </div>
        </Card>

        {/* Agent switcher */}
        <Card style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Switch Agent</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(Object.keys(AGENTS) as AgentType[]).map(agent => {
              const Icon = AGENT_ICONS[agent];
              const isActive = agent === selectedAgent;
              return (
                <button
                  key={agent}
                  onClick={() => handleAgentChange(agent)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px',
                    background: isActive ? `${AGENTS[agent].color}15` : 'var(--subtle)',
                    border: `1px solid ${isActive ? AGENTS[agent].color + '40' : 'var(--border)'}`,
                    borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, color: isActive ? 'var(--text)' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all .15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Icon size={15} color={isActive ? AGENTS[agent].color : 'var(--muted)'} />
                  {AGENTS[agent].name} PEAK
                </button>
              );
            })}
          </div>
        </Card>

        {/* Quick actions for current agent */}
        <Card style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_ACTIONS[selectedAgent].map(q => {
              const Icon = q.icon;
              return (
                <button
                  key={q.label}
                  onClick={() => handleSendMessage(q.label)}
                  disabled={isLoading}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px',
                    background: 'var(--subtle)', border: '1px solid var(--border)',
                    borderRadius: 10, cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: 13, color: 'var(--text)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all .2s', opacity: isLoading ? 0.5 : 1,
                    fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.borderColor = `${agentColor}50`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <Icon size={16} color={agentColor} />
                  {q.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Capabilities</div>
          <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.8 }}>
            • Analyze workout form photos<br />
            • Answer training questions<br />
            • Provide nutrition advice<br />
            • Review recovery data
          </div>
        </Card>

      </div>{/* ── END RIGHT COLUMN ── */}

    </div>
  );
}