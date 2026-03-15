'use client';

import { useState, useEffect } from 'react';
import { Screen, NUTRITION, ATHLETE } from '@/lib/data';
import { ReadinessRing, AnimatedBar, AiNudge, Card } from '../ui';
import { FiMoon, FiActivity, FiZap, FiAward, FiMic, FiCoffee, FiRefreshCw } from 'react-icons/fi';

const s = (delay: number): React.CSSProperties => ({
  animation: `fadeUp 0.4s ease ${delay}s both`,
});

interface Props { userName?: string; onNavigate: (s: Screen) => void; }

interface HealthSummary {
  sleep?: { total_duration?: number; score?: number; efficiency?: number };
  recovery?: { score?: number; resting_heart_rate?: number; hrv?: number };
  activity?: { steps?: number; calories?: number; active_minutes?: number };
}

interface TodayCalories {
  fromWorkouts: number;
  fromFood: number;
}

export default function BriefScreen({ userName, onNavigate }: Props) {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [todayCalories, setTodayCalories] = useState<TodayCalories>({ fromWorkouts: 0, fromFood: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchTodayCalories();
  }, []);

  const fetchTodayCalories = async () => {
    try {
      let fromFood = 0;
      
      const mealsRes = await fetch('/api/meals');
      if (mealsRes.ok) {
        const mealsData = await mealsRes.json();
        if (mealsData.totals?.calories) {
          fromFood = mealsData.totals.calories;
        }
      }
      
      let fromWorkouts = 0;
      const today = new Date().toISOString().split('T')[0];
      
      // Get calories from Strava workouts
      const res = await fetch(`/api/strava-workouts`);
      if (res.ok) {
        const data = await res.json();
        if (data.workouts) {
          const todayStr = today;
          data.workouts.forEach((w: any) => {
            if (w.startDate && w.startDate.startsWith(todayStr)) {
              fromWorkouts += w.estimatedCalories || w.calories || 0;
            }
          });
        }
      }
      
      // Get calories from Your Workouts
      const workoutsRes = await fetch('/api/workouts');
      if (workoutsRes.ok) {
        const workoutsData = await workoutsRes.json();
        if (workoutsData.workouts) {
          const todayStr = today;
          const todayDate = new Date(todayStr);
          workoutsData.workouts.forEach((w: any) => {
            if (w.lastCompletedAt) {
              const completedDate = new Date(w.lastCompletedAt).toISOString().split('T')[0];
              if (completedDate === todayStr) {
                fromWorkouts += w.caloriesBurned || 0;
              }
            }
          });
        }
      }
      
      setTodayCalories({ fromWorkouts, fromFood });
    } catch (err) {
      console.error('Failed to fetch today calories:', err);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/openwearables/data?type=summary');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setSummary(data.data);
          setLastUpdated(new Date());
        }
      }
      
      await Promise.all([
        fetch('/api/daily-summary'),
        fetch('/api/meals'),
      ]);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const sleepHours = summary?.sleep?.total_duration 
    ? formatDuration(summary.sleep.total_duration) 
    : '--';
  const sleepScoreNum = summary?.sleep?.score || summary?.sleep?.efficiency || null;
  const hrvValue = summary?.recovery?.hrv ? `${summary.recovery.hrv}ms` : '--';
  const hrvScoreNum = summary?.recovery?.score || null;
  const readinessScore = summary?.recovery?.score || null;
  const steps = summary?.activity?.steps?.toLocaleString() || '--';
  const workoutCalories = todayCalories.fromWorkouts > 0 ? todayCalories.fromWorkouts.toLocaleString() : '--';

  const stats = [
    { icon: FiMoon,    val: sleepHours,      color: 'var(--blue)',   label: 'Sleep',       pct: sleepScoreNum || 0 },
    { icon: FiActivity, val: hrvValue,       color: 'var(--accent)', label: 'HRV',         pct: hrvScoreNum || 0 },
    { icon: FiZap,     val: steps,          color: 'var(--orange)', label: 'Steps',        pct: summary?.activity?.steps ? Math.min(100, (Number(summary.activity.steps) / 10000) * 100) : 0 },
    { icon: FiAward,   val: workoutCalories, color: 'var(--accent)', label: 'Calories',    pct: todayCalories.fromWorkouts ? Math.min(100, todayCalories.fromWorkouts / 3000 * 100) : 0 },
  ];

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>

      {/* Hero */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto',
        gap: 28, alignItems: 'start', marginBottom: 28,
        ...s(0.05),
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 5vw, 72px)',
            lineHeight: 0.92, letterSpacing: '0.02em', color: 'var(--text)',
          }}>
            GOOD MORNING,<br />
            <span style={{ color: 'var(--accent)' }}>{(userName || ATHLETE.name).toUpperCase()}.</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 10,
          }}>{dayName} · {monthDay} · Week {Math.ceil(today.getDate() / 7)} of training</div>
          {!loading && (
            <button
              onClick={fetchSummary}
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
              }}
            >
              <FiRefreshCw size={12} /> Refresh data
            </button>
          )}
        </div>

        {/* Ring card */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 160 }}>
          <div style={{ position: 'relative' }}>
            <ReadinessRing value={readinessScore ?? 0} size={120} label={String(readinessScore ?? '--')} subLabel="READY" />
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiRefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--muted)' }} />
              </div>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 10,
          }}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Readiness Score'}
          </div>
        </Card>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 24, ...s(0.1),
      }}>
        {stats.map(stat => (
          <Card key={stat.label} style={{ padding: '18px 16px', transition: 'all 0.2s', cursor: 'default' }}
            className="stat-hover"
          >
            <div style={{ fontSize: 20, marginBottom: 10 }}><stat.icon size={20} /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, color: stat.color, marginBottom: 4 }}>
              {stat.val}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {stat.label}
            </div>
            <div style={{ marginTop: 10 }}>
              <AnimatedBar pct={stat.pct} color={stat.color} height={3} />
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, ...s(0.15) }}>

        {/* Coach card */}
        <Card style={{
          padding: '20px 22px',
          borderLeft: '3px solid var(--accent)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 180, height: 180,
            background: 'radial-gradient(circle, rgba(200,255,0,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 16, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
            Coach PEAK
          </div>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.6, color: 'var(--text)' }}>
            Your legs are carrying <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>3 days of fatigue.</strong> Upper body session today. Cap intensity at <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>70%</strong> — focus on technique, not weight. Eat before 5PM to be ready for a 6PM session.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => onNavigate('train')}
              style={{
                background: 'var(--accent)', color: '#000', border: 'none',
                borderRadius: 10, padding: '12px 22px',
                fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.05em',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,255,0,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >START SESSION</button>
            {[{ icon: FiMic, label: 'Ask Coach', screen: 'coach' as Screen }, { icon: FiCoffee, label: 'Fuel Plan', screen: 'fuel' as Screen }].map(btn => (
              <button key={btn.label}
                onClick={() => onNavigate(btn.screen)}
                style={{
                  background: 'var(--card2)', color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 18px',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--muted)'; e.currentTarget.style.background = 'var(--subtle)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card2)'; }}
              ><span><btn.icon size={16} /></span>{btn.label}</button>
            ))}
          </div>
        </Card>

        {/* Today panel */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Today at a Glance
          </div>
          {[
            { dot: 'var(--blue)',   label: 'Sleep quality',   val: typeof sleepScoreNum === 'number' ? `${sleepScoreNum} / 100` : '--' },
            { dot: 'var(--accent)', label: 'Calories burned', val: todayCalories.fromWorkouts > 0 ? `${todayCalories.fromWorkouts} kcal` : '--' },
            { dot: 'var(--green)',  label: 'Food consumed',  val: todayCalories.fromFood > 0 ? `${todayCalories.fromFood} kcal` : '--' },
            { dot: 'var(--purple)', label: 'Recovery',       val: typeof readinessScore === 'number' ? `${readinessScore} / 100` : '--' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{item.val}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
