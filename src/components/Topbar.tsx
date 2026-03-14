'use client';

import { useEffect, useState } from 'react';
import { ATHLETE } from '@/lib/data';
import { useTheme } from '@/lib/theme';
import { PulseDot, TerrainIcon } from './ui';
import { FiSun, FiMoon } from 'react-icons/fi';

interface TopbarProps {
  userInitials?: string;
}

export default function Topbar({ userInitials }: TopbarProps) {
  const [time, setTime] = useState('');
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';
  const toggleTheme = themeContext?.toggleTheme || (() => {});

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(8,8,9,0.9)',
      backdropFilter: 'blur(20px)',
      zIndex: 10,
      height: 'var(--topbar-h)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TerrainIcon size={24} color="var(--accent)" />
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 26,
            color: 'var(--accent)', letterSpacing: '0.05em',
            filter: 'drop-shadow(0 0 8px rgba(22,163,74,0.3))',
          }}>PEAK</div>
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PulseDot />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--muted)', letterSpacing: '0.06em',
          }}>OS · ONLINE</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--muted)', letterSpacing: '0.06em',
        }}>{time}</span>

        <button
          onClick={toggleTheme}
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: 'var(--text)',
            fontSize: 14,
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>

        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 15, color: '#000',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 16px rgba(200,255,0,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >{userInitials || ATHLETE.initials}</div>
      </div>
    </header>
  );
}
