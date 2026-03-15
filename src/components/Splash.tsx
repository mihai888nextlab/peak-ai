'use client';

import { useEffect, useState } from 'react';

const HINTS = [
  "Your muscles grow during rest, not during training.",
  "Protein timing matters less than total daily protein intake.",
  "Sleep is when most muscle recovery happens.",
  "Progressive overload is the key to continuous gains.",
  "Hydration affects strength more than most realize.",
  "Consistency beats intensity over time.",
  "Your body adapts to stress—train smart, not just hard.",
  "Recovery days are when you actually get stronger.",
];

function getDailyHint() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return HINTS[dayOfYear % HINTS.length];
}

export default function Splash({ onDone }: { onDone: () => void }) {
  const [hiding, setHiding] = useState(false);
  const [hint, setHint] = useState(getDailyHint());
  const [personalHint, setPersonalHint] = useState('');
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [goalsRes, nutritionRes] = await Promise.all([
          fetch('/api/goals'),
          fetch('/api/meals'),
        ]);

        const goals = await goalsRes.json();
        const nutrition = await nutritionRes.json();

        let newHint = '';

        if (goals?.proteinGoal && nutrition?.totals) {
          const remainingProtein = goals.proteinGoal - (nutrition.totals.protein || 0);
          if (remainingProtein > 0) {
            newHint = `You need ${remainingProtein}g more protein to hit your daily goal of ${goals.proteinGoal}g.`;
          } else if (remainingProtein <= 0) {
            newHint = `You've hit your protein goal! ${Math.abs(remainingProtein)}g over. Great work!`;
          }
        }

        if (goals?.dailyCalorieGoal && nutrition?.totals) {
          const remainingCals = goals.dailyCalorieGoal - (nutrition.totals.calories || 0);
          if (remainingCals > 500) {
            newHint = newHint ? `${newHint} | ${remainingCals} cal remaining.` : `You have ${remainingCals} calories remaining today.`;
          }
        }

        if (newHint) {
          setHint(newHint);
        }
      } catch (e) {
        console.log('[Splash] Could not load user data');
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setHiding(true);
      setTimeout(onDone, 500);
    }, 3000);
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

      {showHint && hint && (
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 420,
          textAlign: 'center',
          padding: '14px 20px',
          background: 'var(--surface)',
          borderRadius: 10,
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: 13,
            color: 'var(--text)',
            lineHeight: 1.5,
          }}>
            {hint}
          </div>
        </div>
      )}
    </div>
  );
}
