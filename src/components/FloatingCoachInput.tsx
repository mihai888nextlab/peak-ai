'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiSend, FiMic, FiVolume2, FiVolumeX, FiLoader, FiChevronDown, FiActivity, FiHeart, FiCoffee, FiAlertCircle } from 'react-icons/fi';
import { TerrainIcon } from './ui';
import { useAudio } from '@/lib/use-audio';
import { AgentType, AGENTS } from '@/lib/agents';

const AGENT_ICONS: Record<AgentType, React.ComponentType<any>> = {
  coach: FiActivity,
  psychologist: FiHeart,
  nutritionist: FiCoffee,
  kinetotherapist: FiAlertCircle,
};

interface FloatingCoachInputProps {
  currentScreen?: string;
  onNavigate?: (screen: any) => void;
}

export default function FloatingCoachInput({ currentScreen, onNavigate }: FloatingCoachInputProps) {
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('coach');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const {
    isRecording = false,
    isTranscribing = false,
    transcript = '',
    startRecording = async () => {},
    stopRecording = () => {},
    speak = () => {},
    isSpeaking = false,
  } = useAudio() || {};

  useEffect(() => {
    const stored = sessionStorage.getItem('selectedAgent') as AgentType;
    if (stored && AGENTS[stored]) {
      setSelectedAgent(stored);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (transcript) {
      setInput(prev => {
        const updated = prev + ' ' + transcript;
        return updated.trim();
      });
    }
  }, [transcript]);

  useEffect(() => {
    const handleAIResponse = (e: CustomEvent) => {
      if (voiceEnabled) {
        speak(e.detail);
      }
    };
    window.addEventListener('coachAIResponse' as any, handleAIResponse);
    return () => window.removeEventListener('coachAIResponse' as any, handleAIResponse);
  }, [voiceEnabled, speak]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const message = input.trim();
    setInput('');

    sessionStorage.setItem('coachPendingMessage', message);
    sessionStorage.setItem('selectedAgent', selectedAgent);

    if (currentScreen !== 'coach') {
      if (onNavigate) {
        onNavigate('coach');
      } else {
        router.push('/app');
      }
    } else {
      window.dispatchEvent(new CustomEvent('coachMessage', { detail: message }));
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setInput('');
      startRecording();
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled && isSpeaking) {
      window.speechSynthesis?.cancel();
    }
  };

  const selectAgent = (agent: AgentType) => {
    setSelectedAgent(agent);
    sessionStorage.setItem('selectedAgent', agent);
    setShowDropdown(false);
    window.dispatchEvent(new CustomEvent('agentChanged', { detail: agent }));
  };

  const currentAgent = AGENTS[selectedAgent];
  const isActive = isRecording || isTranscribing;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      width: '90%',
      maxWidth: 600,
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface)',
          borderRadius: 9999,
          boxShadow: 'var(--shadow-lg)',
          padding: '8px 12px',
          border: '1px solid var(--border)',
          gap: 8,
        }}
      >
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: currentAgent.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${currentAgent.color}40`,
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.2s ease',
            }}
          >
            {(() => {
              const Icon = AGENT_ICONS[selectedAgent];
              return <Icon size={20} color="#000" />;
            })()}
          </button>
          
          {showDropdown && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 8,
              minWidth: 180,
              boxShadow: 'var(--shadow-lg)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                marginBottom: 4,
              }}>
                Select Agent
              </div>
              {Object.values(AGENTS).map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => selectAgent(agent.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    background: selectedAgent === agent.id ? `${agent.color}15` : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {(() => {
                    const Icon = AGENT_ICONS[agent.id];
                    return <Icon size={20} color={selectedAgent === agent.id ? agent.color : 'var(--muted)'} />;
                  })()}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: selectedAgent === agent.id ? agent.color : 'var(--text)',
                    }}>
                      {agent.name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--muted)',
                    }}>
                      {agent.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${currentAgent.name}...`}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: 15,
            color: 'var(--text)',
            outline: 'none',
            minWidth: 150,
            fontFamily: 'inherit',
          }}
        />

        {isActive && (
          <div style={{
            padding: '6px 10px',
            borderRadius: 12,
            background: isRecording ? 'var(--red)' : 'var(--accent)',
            fontSize: 11,
            color: isRecording ? '#fff' : 'var(--bg)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {isTranscribing ? (
              <>
                <FiLoader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Transcribing...
              </>
            ) : (
              'Recording...'
            )}
          </div>
        )}

        <button
          type="button"
          onClick={toggleVoice}
          title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: voiceEnabled ? 'var(--accent)' : 'var(--subtle)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          {voiceEnabled ? (
            <FiVolume2 size={16} color="var(--bg)" />
          ) : (
            <FiVolumeX size={16} color="var(--muted)" />
          )}
        </button>

        <button
          type="button"
          onClick={toggleRecording}
          title={isRecording ? 'Stop recording' : 'Voice input'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isRecording ? 'var(--red)' : 'var(--subtle)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            animation: isRecording ? 'pulse 1s infinite' : 'none',
          }}
        >
          <FiMic size={16} color={isRecording ? '#fff' : 'var(--muted)'} />
        </button>
        
        {input.trim() && !isActive && (
          <button
            type="submit"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.2s ease',
            }}
          >
            <FiSend size={16} color="var(--bg)" />
          </button>
        )}
      </form>
    </div>
  );
}
