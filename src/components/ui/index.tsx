'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export { default as TerrainIcon } from './TerrainIcon';

// ─── PULSE DOT ────────────────────────────────────────────────
export function PulseDot({ color = 'var(--accent)', size = 6 }: { color?: string; size?: number }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      animation: 'pulseDot 2s infinite',
      flexShrink: 0,
    }} />
  );
}

// ─── READINESS RING ───────────────────────────────────────────
export function ReadinessRing({
  value, size = 120, strokeWidth = 9,
  label, subLabel, color = 'var(--accent)',
}: {
  value: number; size?: number; strokeWidth?: number;
  label: string; subLabel?: string; color?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--subtle)" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.28, lineHeight: 1, color }}>{label}</span>
        {subLabel && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{subLabel}</span>}
      </div>
    </div>
  );
}

// ─── ANIMATED BAR ─────────────────────────────────────────────
export function AnimatedBar({
  pct, color, height = 6,
}: { pct: number; color: string; height?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ height, background: 'var(--subtle)', borderRadius: height, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: height,
        background: color, width: `${width}%`,
        transition: 'width 1.2s cubic-bezier(.16,1,.3,1)',
      }} />
    </div>
  );
}

// ─── AI NUDGE ─────────────────────────────────────────────────
export function AiNudge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="ai-nudge" style={{
      borderRadius: 12, padding: 14,
      display: 'flex', gap: 10, alignItems: 'flex-start',
      ...style,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 14, color: '#000',
        flexShrink: 0,
      }}>P</div>
      <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: 'var(--text)', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────
export function Card({
  children, style, className,
}: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────
export function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
      letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10,
    }}>{children}</div>
  );
}

// ─── TYPING DOTS ──────────────────────────────────────────────
export function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--muted)',
          animation: `typingBounce 1s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

// ─── WAVEFORM ─────────────────────────────────────────────────
export function Waveform() {
  const delays = [0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 18, marginTop: 5 }}>
      {delays.map((d, i) => (
        <div key={i} className="waveform-bar" style={{
          width: 3, borderRadius: 2,
          animation: `waveAnim 1.2s ease-in-out infinite`,
          animationDelay: `${d}s`,
        }} />
      ))}
    </div>
  );
}

// ─── SKELETON SVG ─────────────────────────────────────────────
export function SkeletonOverlay({ width = 180, height = 260 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 140 220" style={{ zIndex: 2 }}>
      {/* ideal form */}
      <g stroke="#C8FF00" strokeWidth="2" opacity="0.28">
        <circle cx="70" cy="20" r="12" fill="none" strokeWidth="1.5"/>
        <line x1="70" y1="32" x2="70" y2="100"/>
        <line x1="30" y1="50" x2="110" y2="50"/>
        <line x1="30" y1="50" x2="10"  y2="100"/><line x1="10"  y1="100" x2="20"  y2="145"/>
        <line x1="110" y1="50" x2="130" y2="100"/><line x1="130" y1="100" x2="120" y2="145"/>
        <line x1="45" y1="100" x2="95"  y2="100"/>
        <line x1="45" y1="100" x2="35"  y2="165"/><line x1="35" y1="165" x2="38" y2="215"/>
        <line x1="95" y1="100" x2="105" y2="165"/><line x1="105" y1="165" x2="102" y2="215"/>
        <circle cx="30"  cy="50"  r="4" fill="#C8FF00"/>
        <circle cx="110" cy="50"  r="4" fill="#C8FF00"/>
        <circle cx="10"  cy="100" r="3" fill="#C8FF00"/>
        <circle cx="130" cy="100" r="3" fill="#C8FF00"/>
        <circle cx="45"  cy="100" r="4" fill="#C8FF00"/>
        <circle cx="95"  cy="100" r="4" fill="#C8FF00"/>
      </g>
      {/* user form */}
      <g stroke="white" strokeWidth="2" opacity="0.9">
        <circle cx="72" cy="20" r="12" fill="none" strokeWidth="1.5"/>
        <line x1="72"  y1="32"  x2="72"  y2="100"/>
        <line x1="32"  y1="52"  x2="112" y2="52"/>
        <line x1="32"  y1="52"  x2="8"   y2="105"/><line x1="8"   y1="105" x2="16"  y2="148"/>
        <line x1="112" y1="52"  x2="136" y2="96" /><line x1="136" y1="96"  x2="128" y2="140"/>
        <line x1="47"  y1="102" x2="97"  y2="102"/>
        <line x1="47"  y1="102" x2="36"  y2="167"/><line x1="36"  y1="167" x2="39"  y2="215"/>
        <line x1="97"  y1="102" x2="107" y2="167"/><line x1="107" y1="167" x2="104" y2="215"/>
        <circle cx="32"  cy="52"  r="4" fill="white"/>
        <circle cx="112" cy="52"  r="4" fill="white"/>
        <circle cx="8"   cy="105" r="3" fill="white"/>
        <circle cx="136" cy="96"  r="3" fill="#FF6B35" stroke="#FF6B35"/>
        <circle cx="47"  cy="102" r="4" fill="white"/>
        <circle cx="97"  cy="102" r="4" fill="white"/>
      </g>
      <circle cx="136" cy="96" r="10" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  );
}
