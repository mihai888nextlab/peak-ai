'use client';

import { useState, useEffect } from 'react';
import { GOALS_DATA } from '@/lib/data';
import { Card, SectionLabel, AnimatedBar } from '../ui';
import { FiTarget, FiTrendingUp, FiCheck, FiCalendar, FiAward, FiZap, FiSave, FiEdit2 } from 'react-icons/fi';

const s = (delay: number): React.CSSProperties => ({
  animation: `fadeUp 0.4s ease ${delay}s both`,
});

interface UserGoals {
  dailyCalorieGoal: number;
  goalType: 'maintain' | 'bulk' | 'cut';
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  waterGoal?: number;
  recommendations?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  } | null;
}

interface Props {
  goals?: UserGoals | null;
  onSave?: (goals: UserGoals) => void;
}

export default function GoalsScreen({ goals, onSave }: Props) {
  const { active, completed, weeklyTargets } = GOALS_DATA;
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserGoals>({
    dailyCalorieGoal: goals?.dailyCalorieGoal || 2500,
    goalType: goals?.goalType || 'maintain',
    proteinGoal: goals?.proteinGoal || 180,
    carbsGoal: goals?.carbsGoal || 300,
    fatGoal: goals?.fatGoal || 80,
    gender: goals?.gender || 'male',
    height: goals?.height || 175,
    weight: goals?.weight || 75,
    waterGoal: goals?.waterGoal || 2500,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (goals) {
      setFormData({
        dailyCalorieGoal: goals.dailyCalorieGoal,
        goalType: goals.goalType,
        proteinGoal: goals.proteinGoal,
        carbsGoal: goals.carbsGoal,
        fatGoal: goals.fatGoal,
        gender: goals.gender || 'male',
        height: goals.height || 175,
        weight: goals.weight || 75,
        waterGoal: goals.waterGoal || 2500,
      });
    }
  }, [goals]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        const saved = await res.json();
        onSave?.(saved);
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to save goals:', error);
    } finally {
      setSaving(false);
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'muscle': return FiZap;
      case 'bodyFat': return FiTrendingUp;
      case 'strength': return FiAward;
      case 'streak': return FiCalendar;
      default: return FiTarget;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'muscle': return 'var(--accent)';
      case 'bodyFat': return 'var(--orange)';
      case 'strength': return 'var(--blue)';
      case 'streak': return 'var(--purple)';
      default: return 'var(--accent)';
    }
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'maintain': return 'Maintain Weight';
      case 'bulk': return 'Bulking';
      case 'cut': return 'Cutting';
      default: return type;
    }
  };

  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case 'maintain': return 'var(--blue)';
      case 'bulk': return 'var(--accent)';
      case 'cut': return 'var(--orange)';
      default: return 'var(--accent)';
    }
  };

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 28, ...s(0.05) }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 4vw, 56px)',
          lineHeight: 1, letterSpacing: '0.02em', color: 'var(--text)',
        }}>
          GOALS
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8,
        }}>Track your objectives and milestones</div>
      </div>

      {/* Nutrition Goals */}
      <div style={{ marginBottom: 28, ...s(0.1) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionLabel>Nutrition Goals</SectionLabel>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontFamily: 'var(--font-mono)',
              }}
            >
              <FiEdit2 size={14} /> Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: saving ? 'var(--muted)' : 'var(--accent)', 
                border: 'none', color: '#000',
                cursor: saving ? 'not-allowed' : 'pointer', 
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontFamily: 'var(--font-mono)', padding: '6px 12px', borderRadius: 6,
              }}
            >
              <FiSave size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
        
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {/* Daily Calorie Goal */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Daily Calories
                {goals?.recommendations && (
                  <span style={{ fontWeight: 400, fontSize: 9, color: 'var(--accent)', marginLeft: 6 }}>
                    Rec: {goals.recommendations.calories} kcal
                  </span>
                )}
              </div>
              {editing ? (
                <input
                  type="number"
                  value={formData.dailyCalorieGoal}
                  onChange={(e) => setFormData({ ...formData, dailyCalorieGoal: Number(e.target.value) })}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: 24, fontFamily: 'var(--font-display)',
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', outline: 'none',
                  }}
                />
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent)' }}>
                  {formData.dailyCalorieGoal}
                  <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>kcal</span>
                </div>
              )}
            </div>

            {/* Goal Type */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Goal Type
              </div>
              {editing ? (
                <select
                  value={formData.goalType}
                  onChange={(e) => setFormData({ ...formData, goalType: e.target.value as 'maintain' | 'bulk' | 'cut' })}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: 16,
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', outline: 'none',
                  }}
                >
                  <option value="maintain">Maintain Weight</option>
                  <option value="bulk">Bulking</option>
                  <option value="cut">Cutting</option>
                </select>
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: getGoalTypeColor(formData.goalType) }}>
                  {getGoalTypeLabel(formData.goalType)}
                </div>
              )}
            </div>

            {/* Protein Goal */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Protein Goal
                {goals?.recommendations && (
                  <span style={{ fontWeight: 400, fontSize: 9, color: 'var(--accent)', marginLeft: 6 }}>
                    Rec: {goals.recommendations.protein}g
                  </span>
                )}
              </div>
              {editing ? (
                <input
                  type="number"
                  value={formData.proteinGoal}
                  onChange={(e) => setFormData({ ...formData, proteinGoal: Number(e.target.value) })}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: 24, fontFamily: 'var(--font-display)',
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', outline: 'none',
                  }}
                />
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--blue)' }}>
                  {formData.proteinGoal}
                  <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>g</span>
                </div>
              )}
            </div>

            {/* Carbs Goal */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Carbs Goal
                {goals?.recommendations && (
                  <span style={{ fontWeight: 400, fontSize: 9, color: 'var(--accent)', marginLeft: 6 }}>
                    Rec: {goals.recommendations.carbs}g
                  </span>
                )}
              </div>
              {editing ? (
                <input
                  type="number"
                  value={formData.carbsGoal}
                  onChange={(e) => setFormData({ ...formData, carbsGoal: Number(e.target.value) })}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: 24, fontFamily: 'var(--font-display)',
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', outline: 'none',
                  }}
                />
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent)' }}>
                  {formData.carbsGoal}
                  <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>g</span>
                </div>
              )}
            </div>

            {/* Fat Goal */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Fat Goal
                {goals?.recommendations && (
                  <span style={{ fontWeight: 400, fontSize: 9, color: 'var(--accent)', marginLeft: 6 }}>
                    Rec: {goals.recommendations.fat}g
                  </span>
                )}
              </div>
              {editing ? (
                <input
                  type="number"
                  value={formData.fatGoal}
                  onChange={(e) => setFormData({ ...formData, fatGoal: Number(e.target.value) })}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: 24, fontFamily: 'var(--font-display)',
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', outline: 'none',
                  }}
                />
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--orange)' }}>
                  {formData.fatGoal}
                  <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>g</span>
                </div>
              )}
            </div>

            {/* Water Goal */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Water Goal
                {goals?.recommendations && (
                  <span style={{ fontWeight: 400, fontSize: 9, color: 'var(--accent)', marginLeft: 6 }}>
                    Rec: {goals.recommendations.water}ml
                  </span>
                )}
              </div>
              {editing ? (
                <input
                  type="number"
                  value={formData.waterGoal}
                  onChange={(e) => setFormData({ ...formData, waterGoal: Number(e.target.value) })}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: 24, fontFamily: 'var(--font-display)',
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', outline: 'none',
                  }}
                />
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--blue)' }}>
                  {formData.waterGoal}
                  <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>ml</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 28, ...s(0.15) }}>
        <SectionLabel>Active Goals</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
          {active.map((goal) => {
            const Icon = getMetricIcon(goal.metric);
            const color = getMetricColor(goal.metric);
            return (
              <Card key={goal.id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 12, 
                    background: `${color}15`, border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: color,
                  }}>
                    <Icon size={22} />
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {goal.deadline}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
                  {goal.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                  {goal.target}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.05em' }}>
                      Progress
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: color }}>
                      {goal.progress}%
                    </span>
                  </div>
                  <AnimatedBar pct={goal.progress} color={color} height={6} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Current: <span style={{ color: 'var(--text)' }}>{goal.current}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 28, ...s(0.2) }}>
        <SectionLabel>Weekly Targets</SectionLabel>
        <Card style={{ padding: 20, marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {weeklyTargets.map((target) => {
              const currentNum = typeof target.current === 'number' ? target.current : 0;
              const targetNum = typeof target.target === 'number' ? target.target : 1;
              const progress = (currentNum / targetNum) * 100;
              const color = progress >= 100 ? 'var(--accent)' : progress >= 70 ? 'var(--blue)' : 'var(--orange)';
              return (
                <div key={target.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {target.title}
                    </span>
                    {progress >= 100 && <FiCheck size={12} color="var(--accent)" />}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: color, marginBottom: 4 }}>
                    {target.current}
                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>/ {target.target}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.05em' }}>
                    {target.unit}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <AnimatedBar pct={Math.min(progress, 100)} color={color} height={4} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {completed.length > 0 && (
        <div style={{ ...s(0.25) }}>
          <SectionLabel>Completed</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {completed.map((goal) => (
              <Card key={goal.id} style={{ padding: '16px 20px', opacity: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FiCheck size={16} color="#000" />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text)' }}>
                        {goal.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Target: {goal.target} - Achieved: {goal.achieved}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.05em' }}>
                    {goal.date}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
