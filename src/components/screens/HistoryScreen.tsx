'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui';
import { FiCalendar, FiActivity, FiCoffee, FiTrendingUp, FiClock, FiZap, FiMoon, FiCheck } from 'react-icons/fi';

function getDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDayName(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

interface DayData {
  date: string;
  summary: {
    caloriesBurned: number;
    caloriesFromFood: number;
    steps: number;
    activeMinutes: number;
    workoutsCompleted: number;
    sleepHours?: number;
    sleepScore?: number;
    hrv?: number;
  } | null;
  meals: { name: string; time: string; calories: number; protein: number; carbs: number; fat: number }[];
  workouts: { name: string; duration: string; calories: number; type: string }[];
}

export default function HistoryScreen() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();

    try {
      const [summariesRes, mealsRes, workoutsRes] = await Promise.all([
        fetch(`/api/daily-summary?start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/meals?start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/strava-workouts?start_date=${startDate}&end_date=${endDate}&limit=100`),
      ]);

      const summariesData = summariesRes.ok ? await summariesRes.json() : { summaries: [] };
      const mealsData = mealsRes.ok ? await mealsRes.json() : { meals: [] };
      const workoutsData = workoutsRes.ok ? await workoutsRes.json() : { workouts: [] };

      const mealsByDate: Record<string, DayData['meals']> = {};
      mealsData.meals?.forEach((m: any) => {
        if (!mealsByDate[m.date]) mealsByDate[m.date] = [];
        mealsByDate[m.date].push({
          name: m.name,
          time: m.time,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
        });
      });

      const workoutsByDate: Record<string, DayData['workouts']> = {};
      workoutsData.workouts?.forEach((w: any) => {
        const date = w.startDate?.split('T')[0];
        if (date) {
          if (!workoutsByDate[date]) workoutsByDate[date] = [];
          const mins = Math.round((w.duration || 0) / 60);
          workoutsByDate[date].push({
            name: w.name,
            duration: `${mins} min`,
            calories: w.estimatedCalories || w.calories || 0,
            type: w.sportType || w.type || 'Workout',
          });
        }
      });

      const allDates = new Set<string>();
      summariesData.summaries?.forEach((s: any) => allDates.add(s.date));
      Object.keys(mealsByDate).forEach(d => allDates.add(d));
      Object.keys(workoutsByDate).forEach(d => allDates.add(d));

      const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

      const daysData: DayData[] = sortedDates.map(date => {
        const summary = summariesData.summaries?.find((s: any) => s.date === date);
        return {
          date,
          summary: summary ? {
            caloriesBurned: summary.caloriesBurned || 0,
            caloriesFromFood: summary.caloriesFromFood || 0,
            steps: summary.steps || 0,
            activeMinutes: summary.activeMinutes || 0,
            workoutsCompleted: summary.workoutsCompleted || 0,
            sleepHours: summary.sleepHours,
            sleepScore: summary.sleepScore,
            hrv: summary.hrv,
          } : null,
          meals: mealsByDate[date] || [],
          workouts: workoutsByDate[date] || [],
        };
      });

      setDays(daysData);
    } catch (error) {
      console.error('Failed to fetch history data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 4vw, 48px)',
            lineHeight: 1, letterSpacing: '0.02em', color: 'var(--text)',
            marginBottom: 8,
          }}>
            HISTORY
          </div>
        </div>
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>
          Loading your timeline...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 4vw, 48px)',
          lineHeight: 1, letterSpacing: '0.02em', color: 'var(--text)',
          marginBottom: 8,
        }}>
          HISTORY
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>Your daily timeline</div>
      </div>

      {days.length === 0 ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>
          No data yet. Add meals, complete workouts, or connect your devices to start tracking.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {days.map((day, index) => (
            <div key={day.date} style={{
              animation: `fadeUp 0.4s ease ${index * 0.03}s both`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}>
                <div style={{
                  width: 80,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                }}>
                  {formatDate(day.date)}
                </div>
                <div style={{
                  flex: 1,
                  height: 1,
                  background: 'var(--border)',
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {day.summary && (
                  <>
                    <Card style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <FiZap size={14} color="var(--accent)" />
                        <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calories</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)' }}>
                            {day.summary.caloriesBurned}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>burned</div>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--orange)' }}>
                            {day.summary.caloriesFromFood}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>food</div>
                        </div>
                      </div>
                    </Card>

                    <Card style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <FiActivity size={14} color="var(--blue)" />
                        <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>
                            {day.summary.steps}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>steps</div>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>
                            {day.summary.activeMinutes}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>active min</div>
                        </div>
                      </div>
                    </Card>

                    {day.summary.sleepHours && (
                      <Card style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <FiMoon size={14} color="var(--purple)" />
                          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sleep</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>
                              {day.summary.sleepHours}h
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>hours</div>
                          </div>
                          {day.summary.sleepScore && (
                            <div>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--purple)' }}>
                                {day.summary.sleepScore}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>score</div>
                            </div>
                          )}
                          {day.summary.hrv && (
                            <div>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)' }}>
                                {day.summary.hrv}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>HRV</div>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {day.summary.workoutsCompleted > 0 && (
                      <Card style={{ padding: '14px 16px', borderLeft: '3px solid var(--accent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <FiCheck size={14} color="var(--accent)" />
                          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workouts</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)' }}>
                          {day.summary.workoutsCompleted}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>completed</div>
                      </Card>
                    )}
                  </>
                )}

                {day.meals.length > 0 && (
                  <Card style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <FiCoffee size={14} color="var(--orange)" />
                      <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meals ({day.meals.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {day.meals.slice(0, 3).map((meal, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text)' }}>{meal.name}</span>
                          <span style={{ color: 'var(--muted)' }}>{meal.calories} kcal</span>
                        </div>
                      ))}
                      {day.meals.length > 3 && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          +{day.meals.length - 3} more
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {day.workouts.length > 0 && (
                  <Card style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <FiTrendingUp size={14} color="var(--blue)" />
                      <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activities</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {day.workouts.map((workout, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text)' }}>{workout.name}</span>
                          <span style={{ color: 'var(--muted)' }}>{workout.duration}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {!day.summary && day.meals.length === 0 && day.workouts.length === 0 && (
                  <Card style={{ padding: '14px 16px', opacity: 0.6 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                      No data recorded
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
