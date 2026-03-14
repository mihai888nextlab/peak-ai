'use client';

import { RECOVERY_BARS } from '@/lib/data';
import { ReadinessRing, AnimatedBar, AiNudge, Card } from '../ui';

export default function RecoverScreen() {
  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease 0.05s both' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,52px)', lineHeight: 0.9, letterSpacing: '0.02em' }}>RECOVER</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
          Today&apos;s body report
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

        {/* Score card */}
        <div style={{ animation: 'fadeUp 0.4s ease 0.1s both' }}>
          <Card style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ReadinessRing value={74} size={160} strokeWidth={10} label="74" subLabel="GOOD" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 10, marginBottom: 20 }}>
              Recovery Score
            </div>
            <AiNudge>
              Good to <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>train hard tomorrow.</strong> Sleep before midnight — your HRV loves consistent timing.
            </AiNudge>
          </Card>
        </div>

        {/* Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp 0.4s ease 0.15s both' }}>
          {RECOVERY_BARS.map(bar => (
            <Card key={bar.label} style={{ padding: '18px 20px', transition: 'all 0.2s' }}
              className="rec-hover"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {bar.icon} {bar.label}
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--text)' }}>{bar.value}</span>
              </div>
              <AnimatedBar pct={bar.value} color={bar.color} height={8} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
