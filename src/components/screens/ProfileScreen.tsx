'use client';

import { useState, useEffect } from 'react';
import { Screen } from '@/lib/data';
import { Card } from '../ui';
import { FiUser, FiActivity, FiTrendingUp, FiAward, FiTarget, FiCalendar, FiEdit, FiZap } from 'react-icons/fi';

const s = (delay: number): React.CSSProperties => ({
  animation: `fadeUp 0.4s ease ${delay}s both`,
});

interface Props { 
  onNavigate: (s: Screen) => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

interface UserGoals {
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
}

const PROFILE_STATS = {
  totalWorkouts: 147,
  caloriesBurned: 42500,
  streak: 8,
  trainingDays: 42,
};

const BODY_METRICS = {
  weight: 82.5,
  height: 183,
  bodyFat: 14.2,
  muscleMass: 38.5,
};

const ACHIEVEMENTS = [
  { icon: FiZap, title: 'First Win', desc: 'Completed first workout', date: 'Jan 15, 2026', color: 'var(--accent)' },
  { icon: FiTrendingUp, title: 'Streak Master', desc: '7-day streak achieved', date: 'Feb 3, 2026', color: 'var(--blue)' },
  { icon: FiAward, title: 'Iron Lifter', desc: 'Lifted 1000kg in one session', date: 'Feb 18, 2026', color: 'var(--orange)' },
  { icon: FiCalendar, title: 'Consistent', desc: '20 workouts completed', date: 'Mar 1, 2026', color: 'var(--purple)' },
];

export default function ProfileScreen({ onNavigate, user }: Props) {
  const [userGoals, setUserGoals] = useState<UserGoals>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetch('/api/goals')
      .then(res => res.json())
      .then(data => {
        if (data.gender || data.height || data.weight) {
          setUserGoals({
            gender: data.gender,
            height: data.height,
            weight: data.weight,
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userGoals, applyRecommendations: true }),
      });
      setEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name || 'Athlete';
  const displayEmail = user?.email || '';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>

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
            YOUR<br />
            <span style={{ color: 'var(--accent)' }}>PROFILE.</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 10,
          }}>Track your progress</div>
        </div>

        {/* Profile Avatar Card */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 160 }}>
          {user?.image ? (
            <img 
              src={user.image} 
              alt={displayName}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: 12,
              }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 36, color: '#000',
              marginBottom: 12,
            }}>
              {initials}
            </div>
          )}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
            {displayName}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'var(--subtle)', padding: '4px 10px', borderRadius: 4,
          }}>
            PEAK PRO
          </div>
        </Card>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 24, ...s(0.1),
      }}>
        {[
          { icon: FiActivity, val: PROFILE_STATS.totalWorkouts, label: 'Total Workouts', color: 'var(--accent)' },
          { icon: FiZap, val: PROFILE_STATS.caloriesBurned.toLocaleString(), label: 'Calories Burned', color: 'var(--orange)' },
          { icon: FiTrendingUp, val: PROFILE_STATS.streak, label: 'Day Streak', color: 'var(--blue)' },
          { icon: FiCalendar, val: PROFILE_STATS.trainingDays, label: 'Training Days', color: 'var(--purple)' },
        ].map(stat => (
          <Card key={stat.label} style={{ padding: '18px 16px', transition: 'all 0.2s', cursor: 'default' }}
            className="stat-hover"
          >
            <div style={{ fontSize: 20, marginBottom: 10, color: stat.color }}><stat.icon size={20} /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, color: stat.color, marginBottom: 4 }}>
              {stat.val}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {stat.label}
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom Section - Body Metrics & Achievements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, ...s(0.15) }}>

        {/* Body Metrics Card */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Body Metrics
            </div>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
              style={{
                background: 'transparent', border: 'none', color: editing ? 'var(--accent)' : 'var(--muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, padding: '4px 8px', borderRadius: 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!editing) { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--subtle)'; }}}
              onMouseLeave={e => { if (!editing) { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}}
            >
              <FiEdit size={14} />
              {editing ? (saving ? 'Saving...' : 'Save') : 'Edit'}
            </button>
          </div>
          
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Gender</div>
                <select
                  value={userGoals.gender || 'male'}
                  onChange={(e) => setUserGoals({ ...userGoals, gender: e.target.value as any })}
                  style={{ width: '100%', padding: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Height (cm)</div>
                  <input
                    type="number"
                    value={userGoals.height || ''}
                    onChange={(e) => setUserGoals({ ...userGoals, height: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Weight (kg)</div>
                  <input
                    type="number"
                    value={userGoals.weight || ''}
                    onChange={(e) => setUserGoals({ ...userGoals, weight: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
            {[
              { icon: FiUser, label: 'Weight', value: `${userGoals.weight || '--'} kg`, color: 'var(--accent)' },
              { icon: FiTarget, label: 'Height', value: `${userGoals.height || '--'} cm`, color: 'var(--blue)' },
              { icon: FiActivity, label: 'Body Fat', value: '--%', color: 'var(--orange)' },
              { icon: FiTrendingUp, label: 'Muscle Mass', value: '-- kg', color: 'var(--purple)' },
            ].map((metric, i) => (
            <div key={metric.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ 
                width: 36, height: 36, borderRadius: 8, 
                background: 'var(--subtle)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: metric.color,
              }}>
                <metric.icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{metric.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Updated today</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: metric.color }}>
                {metric.value}
              </div>
            </div>
            ))}
            </>
          )}
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Recent Achievements
          </div>
          
          {ACHIEVEMENTS.map((achievement, i) => (
            <div key={achievement.title} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 0', borderBottom: i < ACHIEVEMENTS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, 
                background: `${achievement.color}15`, 
                border: `1px solid ${achievement.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: achievement.color, flexShrink: 0,
              }}>
                <achievement.icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {achievement.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                  {achievement.desc}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.05em' }}>
                  {achievement.date}
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ marginTop: 24, ...s(0.2) }}>
        <Card style={{ padding: 20, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)',
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 16, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
                Account
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text)', marginBottom: 4 }}>
                {displayEmail || 'No email'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Signed in with Google
              </div>
            </div>
            <button
              style={{
                background: 'var(--accent)', color: '#000', border: 'none',
                borderRadius: 10, padding: '12px 22px',
                fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.05em',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,255,0,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              UPGRADE PLAN
            </button>
          </div>
        </Card>
      </div>

    </div>
  );
}
