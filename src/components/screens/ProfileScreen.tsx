'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui';
import { FiUser, FiActivity, FiTarget, FiEdit } from 'react-icons/fi';

const s = (delay: number): React.CSSProperties => ({
  animation: `fadeUp 0.4s ease ${delay}s both`,
});

interface Props { 
  onNavigate: (s: any) => void;
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
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      <div style={s(0)}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 5vw, 72px)',
          lineHeight: 0.92, letterSpacing: '0.02em', color: 'var(--text)',
          marginBottom: 10,
        }}>
          YOUR<br />
          <span style={{ color: 'var(--accent)' }}>PROFILE.</span>
        </div>
      </div>

      <div style={s(1)}>
        <Card style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          {user?.image ? (
            <img src={user.image} alt={displayName} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 24, color: '#000',
            }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text)' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.email || ''}</div>
          </div>
        </Card>
      </div>

      <div style={s(2)}>
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
              }}
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
            <div>
              {[
                { icon: FiUser, label: 'Weight', value: `${userGoals.weight || '--'} kg`, color: 'var(--accent)' },
                { icon: FiTarget, label: 'Height', value: `${userGoals.height || '--'} cm`, color: 'var(--blue)' },
                { icon: FiActivity, label: 'Gender', value: userGoals.gender ? userGoals.gender.charAt(0).toUpperCase() + userGoals.gender.slice(1) : '--', color: 'var(--orange)' },
              ].map((metric, i) => (
                <div key={metric.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
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
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: metric.color }}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
