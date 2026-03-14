'use client';

import { useEffect, useState } from 'react';

export default function Splash({ onDone }: { onDone: () => void }) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setHiding(true);
      setTimeout(onDone, 500);
    }, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      animation: hiding ? 'splashOut 0.5s ease forwards' : undefined,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 120, color: 'var(--accent)',
        letterSpacing: '0.05em', lineHeight: 1,
        filter: 'drop-shadow(0 0 40px rgba(200,255,0,0.25))',
        animation: 'logoIn 0.8s cubic-bezier(.16,1,.3,1) 0.3s both',
      }}>
        PEAK
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12, color: 'var(--muted)',
        letterSpacing: '0.25em', textTransform: 'uppercase',
        animation: 'logoIn 0.8s cubic-bezier(.16,1,.3,1) 0.6s both',
      }}>
        Athletic Intelligence
      </div>
      <div style={{
        width: 1,
        background: 'linear-gradient(to bottom, var(--accent), transparent)',
        marginTop: 32,
        animation: 'lineGrow 0.8s ease 1.2s both',
      }} />
    </div>
  );
}
