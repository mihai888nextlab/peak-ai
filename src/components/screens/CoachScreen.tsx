'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Message, READINESS } from '@/lib/data';
import { PulseDot, TypingDots, Card } from '../ui';
import { FiSend, FiImage, FiActivity, FiCoffee, FiZap, FiHeart } from 'react-icons/fi';
import { AgentType, AGENTS, AGENT_PROMPTS } from '@/lib/agents';

const AGENT_ICONS: Record<AgentType, React.ComponentType<any>> = {
  coach: FiActivity,
  psychologist: FiHeart,
  nutritionist: FiCoffee,
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/## (.+)/g, '<div style="font-size:16px;font-weight:600;margin:12px 0 6px">$1</div>')
    .replace(/- (.+)/g, '<div style="margin-left:12px;margin-bottom:4px">$1</div>')
    .replace(/\n/g, '<br/>');
}

function createInitialMessage(agent: AgentType, goals: UserGoals | null | undefined): Message {
  const agentConfig = AGENTS[agent];
  
  const messages: Record<AgentType, string> = {
    coach: `I'm **Coach PEAK**, your elite athletic intelligence coach.

## What I Do
- Analyze your training & recovery data
- Provide science-based training advice
- Optimize your training strategy
- Help prevent overtraining

## Your Goals
- **Calorie Goal**: ${goals?.dailyCalorieGoal || 2500} kcal/day
- **Goal Type**: ${goals?.goalType === 'bulk' ? 'Bulking' : goals?.goalType === 'cut' ? 'Cutting' : 'Maintenance'}
- **Protein**: ${goals?.proteinGoal || 180}g | **Carbs**: ${goals?.carbsGoal || 300}g | **Fat**: ${goals?.fatGoal || 80}g

**Let's crush it!** What do you need help with?`,

    psychologist: `I'm **Dr. MIND**, your sports psychologist.

## What I Do
- Help with mental performance
- Manage pre-competition anxiety
- Build mental resilience
- Support motivation and mindset
- Guide stress management

## Your Context
- Training Load: Based on your workout data
- Goals: ${goals?.goalType === 'bulk' ? 'Building muscle' : goals?.goalType === 'cut' ? 'Losing fat' : 'Maintaining'}

**How can I support you today?**`,

    nutritionist: `I'm **Chef PEAK**, your sports nutritionist.

## What I Do
- Meal planning and nutrition advice
- Pre/post-workout nutrition
- Calorie and macro management
- Supplement guidance
- Hydration strategies

## Your Goals
- **Daily Calories**: ${goals?.dailyCalorieGoal || 2500} kcal
- **Goal**: ${goals?.goalType === 'bulk' ? 'Bulk (surplus)' : goals?.goalType === 'cut' ? 'Cut (deficit)' : 'Maintain'}
- **Macros**: Protein ${goals?.proteinGoal || 180}g | Carbs ${goals?.carbsGoal || 300}g | Fat ${goals?.fatGoal || 80}g

**What would you like to eat today?**`,
  };

  return {
    id: '1',
    from: 'peak',
    text: messages[agent],
    time: now(),
    showWave: true,
  };
}

export default function CoachScreen({ goals }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('coach');
  const initialMessage = useMemo(() => createInitialMessage(selectedAgent, goals), [selectedAgent, goals]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('selectedAgent') as AgentType;
    if (stored && AGENTS[stored]) {
      setSelectedAgent(stored);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      setMessages([initialMessage]);
      setInitialized(true);
    }
  }, [initialMessage, initialized]);

  useEffect(() => {
    const handleMessage = (e: Event) => {
      const message = (e as CustomEvent).detail;
      setInput(message);
      sendToCoach(message);
    };
    const handleAgentChange = (e: Event) => {
      const agent = (e as CustomEvent).detail as AgentType;
      setSelectedAgent(agent);
      setMessages([createInitialMessage(agent, goals)]);
    };
    
    window.addEventListener('coachMessage' as any, handleMessage);
    window.addEventListener('agentChanged' as any, handleAgentChange);
    return () => {
      window.removeEventListener('coachMessage' as any, handleMessage);
      window.removeEventListener('agentChanged' as any, handleAgentChange);
    };
  }, [goals]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    const handleMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setTimeout(() => sendToCoach(customEvent.detail), 100);
      }
    };

    const pendingMsg = sessionStorage.getItem('coachPendingMessage');
    if (pendingMsg) {
      sessionStorage.removeItem('coachPendingMessage');
      setTimeout(() => sendToCoach(pendingMsg), 500);
    }

    window.addEventListener('coachMessage', handleMessage);
    return () => window.removeEventListener('coachMessage', handleMessage);
  }, [initialized]);

  const sendToCoach = async (text: string) => {
    if (!text.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: genId(),
      from: 'user',
      text: text || (selectedImage ? '[Image uploaded]' : ''),
      time: now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setTyping(true);

    try {
      const chatHistory: ChatMessage[] = messages
        .filter(m => m.id !== '1')
        .map(m => ({
          role: m.from === 'peak' ? 'assistant' as const : 'user' as const,
          content: m.text.replace(/<\/?strong>/g, ''),
        }));

      chatHistory.push({ role: 'user', content: text });

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          imageUrl: selectedImage,
          goals: goals,
          agent: selectedAgent,
        }),
      });

      const data = await res.json();

      if (data.response) {
        if (data.detectedAgent && data.detectedAgent !== selectedAgent) {
          setSelectedAgent(data.detectedAgent);
          sessionStorage.setItem('selectedAgent', data.detectedAgent);
          setMessages([createInitialMessage(data.detectedAgent, goals)]);
        }

        const formattedResponse = parseMarkdown(data.response);

        setMessages(prev => [...prev, {
          id: genId(),
          from: 'peak',
          text: formattedResponse,
          time: now(),
        }]);

        window.dispatchEvent(new CustomEvent('coachAIResponse', { detail: data.response }));
      } else {
        setMessages(prev => [...prev, {
          id: genId(),
          from: 'peak',
          text: 'Sorry, I hit a snag. Try again.',
          time: now(),
        }]);
      }
    } catch (error) {
      console.error('Coach error:', error);
      setMessages(prev => [...prev, {
        id: genId(),
        from: 'peak',
        text: 'Connection issue. Check your API key in .env.local',
        time: now(),
      }]);
    } finally {
      setTyping(false);
      setSelectedImage(null);
      scrollToBottom();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: '100%' }}>

      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', height: '100%' }}>

        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: AGENTS[selectedAgent].color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${AGENTS[selectedAgent].color}40`,
          }}>{(() => {
            const Icon = AGENT_ICONS[selectedAgent];
            return <Icon size={22} color="#000" />;
          })()}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{AGENTS[selectedAgent].name} PEAK</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <PulseDot size={6} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: AGENTS[selectedAgent].color, letterSpacing: '0.05em' }}>
                Online - Groq AI
              </span>
            </div>
          </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex', flexDirection: 'column',
              alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}>
              {msg.from === 'peak' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: AGENTS[selectedAgent].color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{(() => {
                    const Icon = AGENT_ICONS[selectedAgent];
                    return <Icon size={14} color="#000" />;
                  })()}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{AGENTS[selectedAgent].name} PEAK</span>
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
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }} />
              </div>
              
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
                marginTop: 4,
              }}>{msg.time}</span>
            </div>
          ))}
          {typing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start', maxWidth: '80%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 12, color: '#000',
                }}>P</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Coach PEAK</span>
              </div>
              <div style={{
                padding: '16px 20px', borderRadius: '20px 20px 20px 8px',
                background: 'var(--card)', border: '1px solid var(--border)',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                <TypingDots />
              </div>
            </div>
          )}
        </div>
        </div>

        <div style={{ padding: 20, background: 'var(--surface)' }}>
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

        <Card style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedAgent === 'coach' && [
              { label: 'How should I train today?', icon: FiActivity },
              { label: 'What\'s my readiness?', icon: FiZap },
              { label: 'Upper body tips', icon: FiActivity },
            ].map(q => (
              <button
                key={q.label}
                onClick={() => sendToCoach(q.label)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 14px',
                  background: 'var(--subtle)', border: '1px solid var(--border)', borderRadius: 10,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                <q.icon size={16} color={AGENTS.coach.color} />
                {q.label}
              </button>
            ))}
            {selectedAgent === 'psychologist' && [
              { label: 'I\'m feeling stressed', icon: FiActivity },
              { label: 'Help with motivation', icon: FiZap },
              { label: 'Pre-competition anxiety', icon: FiCoffee },
            ].map(q => (
              <button
                key={q.label}
                onClick={() => sendToCoach(q.label)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 14px',
                  background: 'var(--subtle)', border: '1px solid var(--border)', borderRadius: 10,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                <q.icon size={16} color={AGENTS.psychologist.color} />
                {q.label}
              </button>
            ))}
            {selectedAgent === 'nutritionist' && [
              { label: 'What should I eat today?', icon: FiCoffee },
              { label: 'Pre-workout meal', icon: FiActivity },
              { label: 'Protein target check', icon: FiZap },
            ].map(q => (
              <button
                key={q.label}
                onClick={() => sendToCoach(q.label)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 14px',
                  background: 'var(--subtle)', border: '1px solid var(--border)', borderRadius: 10,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                <q.icon size={16} color={AGENTS.nutritionist.color} />
                {q.label}
              </button>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Capabilities</div>
          <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6 }}>
            - Analyze workout form photos<br />
            - Answer training questions<br />
            - Provide nutrition advice<br />
            - Review recovery data
          </div>
        </Card>
      </div>
    </div>
  );
}
