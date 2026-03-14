'use client';

import { useState, useEffect } from 'react';
import { ANALYTICS_DATA } from '@/lib/data';
import { Card, SectionLabel, AnimatedBar } from '../ui';
import { FiTrendingUp, FiCalendar, FiActivity, FiZap, FiRefreshCw } from 'react-icons/fi';

const s = (delay: number): React.CSSProperties => ({
  animation: `fadeUp 0.4s ease ${delay}s both`,
});

interface Props {
  onNavigate: (screen: 'brief' | 'train' | 'fuel' | 'recover' | 'coach' | 'profile' | 'analytics' | 'history' | 'goals' | 'settings') => void;
}

function BarChart({ 
  data, 
  maxValue, 
  color = 'var(--accent)',
  height = 80 
}: { 
  data: { value: number; label: string }[]; 
  maxValue: number;
  color?: string;
  height?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height, gap: 6 }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ 
            width: '100%', 
            height: `${(item.value / maxValue) * height}px`, 
            background: item.value > 0 ? color : 'var(--subtle)',
            borderRadius: 4,
            transition: 'all 0.4s ease',
            minHeight: item.value > 0 ? 4 : 2,
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ 
  data, 
  maxValue, 
  color = 'var(--accent)',
  height = 60,
  showDots = true 
}: { 
  data: number[]; 
  maxValue: number;
  color?: string;
  height?: number;
  showDots?: boolean;
}) {
  const width = 200;
  const padding = 8;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - (val / maxValue) * chartHeight,
  }));
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((ratio, i) => (
        <line 
          key={i}
          x1={padding} 
          y1={padding + chartHeight * ratio} 
          x2={width - padding} 
          y2={padding + chartHeight * ratio} 
          stroke="var(--border)" 
          strokeWidth="0.5" 
          strokeDasharray="2,2"
        />
      ))}
      <path 
        d={pathD} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
      />
      {showDots && points.map((p, i) => (
        <circle 
          key={i} 
          cx={p.x} 
          cy={p.y} 
          r="3" 
          fill={color}
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        />
      ))}
    </svg>
  );
}

export default function AnalyticsScreen({ onNavigate }: Props) {
  const [summary, setSummary] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { weekly, monthly, workoutTrends, calorieTrends, recoveryTrends } = ANALYTICS_DATA;
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, workoutsRes] = await Promise.all([
        fetch('/api/openwearables/data?type=summary'),
        fetch('/api/openwearables/data?type=workouts&start_date=' + getDaysAgo(7)),
      ]);
      
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.data);
      }
      
      if (workoutsRes.ok) {
        const data = await workoutsRes.json();
        setWorkouts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  function getDaysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  const weeklyWorkouts = summary?.activity?.workouts || weekly.workouts.completed;
  const weeklyCalories = summary?.activity?.calories || weekly.calories.burned;
  const sleepScore = summary?.sleep?.score || 0;
  const recoveryScore = summary?.recovery?.score || 0;
  
  const workoutData = workoutTrends.map(w => ({ value: w.duration, label: w.day }));
  const calorieIntakeData = calorieTrends.map(c => ({ value: c.intake, label: c.day }));
  const recoveryData = recoveryTrends.map(r => r.score);
  const hrvData = recoveryTrends.map(r => r.hrv);
  
  const weeklyStats = [
    { icon: FiActivity, label: 'Workouts', value: `${weeklyWorkouts}/${weekly.workouts.target}`, unit: 'sessions', trend: '+1 from last week', color: 'var(--accent)' },
    { icon: FiZap, label: 'Volume', value: weekly.volume.total.toLocaleString(), unit: weekly.volume.unit, trend: weekly.volume.trend, color: 'var(--blue)' },
    { icon: FiTrendingUp, label: 'Intensity', value: weekly.avgIntensity.value, unit: weekly.avgIntensity.unit, trend: weekly.avgIntensity.trend, color: 'var(--orange)' },
    { icon: FiZap, label: 'Calories', value: weeklyCalories.toLocaleString(), unit: 'kcal', trend: '+200 from last week', color: 'var(--purple)' },
  ];

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      
      <div style={{ marginBottom: 28, ...s(0.05), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 4vw, 56px)',
            lineHeight: 1, letterSpacing: '0.02em', color: 'var(--text)',
          }}>
            ANALYTICS
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8,
          }}>Track your progress and trends</div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            background: loading ? 'var(--subtle)' : 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
            color: 'var(--muted)',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <FiRefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 24, ...s(0.1),
      }}>
        {weeklyStats.map((stat) => (
          <Card key={stat.label} style={{ padding: '18px 16px', transition: 'all 0.2s', cursor: 'default' }} className="stat-hover">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 18, color: stat.color }}>
                <stat.icon size={18} />
              </div>
              <div style={{ 
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)',
                letterSpacing: '0.05em', 
              }}>
                {stat.trend}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: stat.color, marginBottom: 2 }}>
              {stat.value}
              <span style={{ fontSize: 12, marginLeft: 4, color: 'var(--muted)' }}>{stat.unit}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {stat.label}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, ...s(0.15) }}>
        
        <Card style={{ padding: 20 }}>
          <SectionLabel>Weekly Workout Duration (min)</SectionLabel>
          <BarChart 
            data={workoutData} 
            maxValue={80} 
            color="var(--accent)"
            height={90}
          />
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionLabel>Daily Calorie Intake</SectionLabel>
          <BarChart 
            data={calorieIntakeData} 
            maxValue={3000} 
            color="var(--orange)"
            height={90}
          />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, ...s(0.2) }}>
        <Card style={{ padding: 20 }}>
          <SectionLabel>Recovery Score Trend</SectionLabel>
          <TrendChart 
            data={recoveryData} 
            maxValue={100} 
            color="var(--accent)"
            height={70}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {recoveryTrends.slice(0, 5).map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: d.score >= 70 ? 'var(--accent)' : d.score >= 60 ? 'var(--orange)' : 'var(--red)' }}>
                  {d.score}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>{d.day}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionLabel>HRV Trend (ms)</SectionLabel>
          <TrendChart 
            data={hrvData} 
            maxValue={80} 
            color="var(--blue)"
            height={70}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {recoveryTrends.slice(0, 5).map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--blue)' }}>
                  {d.hrv}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>{d.day}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ ...s(0.25) }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <FiCalendar size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Monthly Overview</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { label: 'Workouts', value: `${monthly.workouts.completed}/${monthly.workouts.target}`, progress: (monthly.workouts.completed / monthly.workouts.target) * 100, color: 'var(--accent)' },
              { label: 'Volume', value: `${(monthly.volume.total / 1000).toFixed(0)}k kg`, progress: 75, color: 'var(--blue)' },
              { label: 'Intensity', value: `${monthly.avgIntensity.value}%`, progress: monthly.avgIntensity.value, color: 'var(--orange)' },
              { label: 'Calories', value: `${(monthly.calories.burned / 1000).toFixed(1)}k kcal`, progress: 82, color: 'var(--purple)' },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: item.color }}>{item.value}</span>
                </div>
                <AnimatedBar pct={item.progress} color={item.color} height={4} />
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
