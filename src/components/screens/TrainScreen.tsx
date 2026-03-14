'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, AiNudge } from '../ui';
import { FiPlay, FiPlus, FiTrash2, FiClock, FiX, FiCheck, FiChevronRight, FiSave, FiRefreshCw } from 'react-icons/fi';
import ExercisePicker from '../ExercisePicker';

interface ExerciseInWorkout {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

interface Workout {
  _id: string;
  name: string;
  exercises: ExerciseInWorkout[];
}

interface ActiveSession {
  _id: string;
  workoutName?: string;
  startTime: Date;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: { setNumber: number; reps: number; weight: number; completedAt: Date }[];
  }[];
}

interface StravaWorkout {
  id: string;
  name: string;
  type: string;
  start_date: string;
  duration: number;
  distance: number;
  elevation: number;
  calories: number;
  estimatedCalories?: number;
  avgSpeed?: number;
  maxSpeed?: number;
}

const s = (delay: number): React.CSSProperties => ({
  animation: `fadeUp 0.4s ease ${delay}s both`,
});

type View = 'list' | 'builder' | 'session';

export default function TrainScreen() {
  const [view, setView] = useState<View>('list');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stravaWorkouts, setStravaWorkouts] = useState<StravaWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [stravaLoading, setStravaLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<ExerciseInWorkout[]>([]);
  const [workoutName, setWorkoutName] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(0);

  useEffect(() => {
    fetchWorkouts();
    checkActiveSession();
    fetchStravaWorkouts();
  }, []);

  const fetchStravaWorkouts = async (forceRefresh: boolean = false) => {
    setStravaLoading(true);
    try {
      // First try to get from our MongoDB (skip if forceRefresh)
      if (!forceRefresh) {
        const dbRes = await fetch('/api/strava-workouts');
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          if (dbData.workouts && dbData.workouts.length > 0) {
            const formatted = dbData.workouts.map((w: any) => ({
              id: w.stravaId,
              name: w.name,
              type: w.sportType || w.type,
              start_date: w.startDateLocal || w.startDate,
              duration: w.duration,
              distance: w.distance,
              elevation: w.elevation,
              calories: w.estimatedCalories || w.calories || 0,
              estimatedCalories: w.estimatedCalories,
              avgSpeed: w.avgSpeed,
            }));
            setStravaWorkouts(formatted);
            setStravaLoading(false);
            return;
          }
        }
      }

      // Trigger sync from OpenWearables first
      try {
        const syncRes = await fetch('/api/openwearables/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'strava', data_type: 'workouts' }),
        });
        const syncData = await syncRes.json();
        console.log('Strava sync result:', syncData);
        
        if (syncData.workoutsSaved > 0) {
          console.log('Saved', syncData.workoutsSaved, 'workouts from sync');
        }
      } catch (syncErr) {
        console.error('Strava sync failed:', syncErr);
      }

      // Refetch from MongoDB (workouts should now be saved)
      const dbRes = await fetch('/api/strava-workouts');
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        if (dbData.workouts && dbData.workouts.length > 0) {
          const formatted = dbData.workouts.map((w: any) => ({
            id: w.stravaId,
            name: w.name,
            type: w.sportType || w.type,
            start_date: w.startDateLocal || w.startDate,
            duration: w.duration,
            distance: w.distance,
            elevation: w.elevation,
            calories: w.estimatedCalories || w.calories || 0,
            estimatedCalories: w.estimatedCalories,
            avgSpeed: w.avgSpeed,
          }));
          setStravaWorkouts(formatted);
          setStravaLoading(false);
          return;
        }
      }
      
      setStravaWorkouts([]);
    } catch (err) {
      console.error('Failed to fetch Strava workouts:', err);
    } finally {
      setStravaLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'session' && activeSession && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setRestTimer(t => t === null ? null : Math.max(0, t - 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, activeSession]);

  useEffect(() => {
    if (view === 'session' && activeSession) {
      sessionTimerRef.current = setInterval(() => {
        setElapsedTime(e => e + 1);
      }, 1000);
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [view, activeSession]);

  const fetchWorkouts = async () => {
    try {
      const res = await fetch('/api/workouts');
      if (!res.ok) {
        console.error('Workouts API error:', res.status, await res.text());
        setWorkouts([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      console.log('Workouts API response:', data);
      setWorkouts(data.workouts || []);
    } catch (err) {
      console.error('Failed to fetch workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = async () => {
    try {
      const res = await fetch('/api/sessions?active=true');
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
        setView('session');
      }
    } catch (err) {
      console.error('Failed to check session:', err);
    }
  };

  const handleAddExercise = (exercise: { id: string; name: string; sets: number; reps: string; restSeconds: number }) => {
    setCurrentWorkout([...currentWorkout, exercise]);
  };

  const handleRemoveExercise = (index: number) => {
    setCurrentWorkout(currentWorkout.filter((_, i) => i !== index));
  };

  const handleSaveWorkout = async () => {
    if (!workoutName || currentWorkout.length === 0) return;
    
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workoutName,
          exercises: currentWorkout,
          estimatedDuration: currentWorkout.length * 10,
        }),
      });
      
      if (res.ok) {
        setWorkoutName('');
        setCurrentWorkout([]);
        setView('list');
        fetchWorkouts();
      }
    } catch (err) {
      console.error('Failed to save workout:', err);
    }
  };

  const startWorkout = async (workout: Workout) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout._id,
          workoutName: workout.name,
        }),
      });
      
      const data = await res.json();
      if (data.session) {
        const sessionExercises = workout.exercises.map(ex => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: [],
        }));
        setActiveSession({ ...data.session, exercises: sessionExercises });
        setCurrentExerciseIndex(0);
        setCurrentSetIndex(0);
        setElapsedTime(0);
        setView('session');
      }
    } catch (err) {
      console.error('Failed to start workout:', err);
    }
  };

  const logSet = async (reps: number, weight: number) => {
    if (!activeSession) return;

    const updatedExercises = [...activeSession.exercises];
    const exercise = updatedExercises[currentExerciseIndex];
    
    exercise.sets.push({
      setNumber: currentSetIndex + 1,
      reps,
      weight,
      completedAt: new Date(),
    });

    setActiveSession({ ...activeSession, exercises: updatedExercises });

    await fetch(`/api/sessions/${activeSession._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercises: updatedExercises }),
    });

    const currentExercise = currentWorkout[currentExerciseIndex];
    if (currentSetIndex < currentExercise.sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
      setRestTimer(currentExercise.restSeconds);
    } else if (currentExerciseIndex < currentWorkout.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      setRestTimer(currentWorkout[currentExerciseIndex].restSeconds);
    }
  };

  const finishSession = async () => {
    if (!activeSession) return;
    
    await fetch(`/api/sessions/${activeSession._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', endTime: new Date() }),
    });

    setActiveSession(null);
    setView('list');
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
  };

  const cancelSession = async () => {
    if (!activeSession) return;
    
    await fetch(`/api/sessions/${activeSession._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    setActiveSession(null);
    setView('list');
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (view === 'builder') {
    return (
      <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
        <div style={s(0)}>
          <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <FiChevronRight style={{ transform: 'rotate(180deg)' }} /> Back to Workouts
          </button>
          
          <input
            type="text"
            placeholder="Workout Name (e.g., Push Day)"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            style={{
              fontSize: 28, fontFamily: 'var(--font-display)', border: 'none', background: 'transparent',
              color: 'var(--text)', width: '100%', marginBottom: 20, outline: 'none',
            }}
          />
        </div>

        <div style={s(0.1)}>
          {currentWorkout.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              No exercises yet. Add your first exercise.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {currentWorkout.map((ex, i) => (
                <Card key={i} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--muted)', width: 30 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{ex.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {ex.sets} x {ex.reps} · {ex.restSeconds}s rest
                    </div>
                  </div>
                  <button onClick={() => handleRemoveExercise(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 8 }}>
                    <FiTrash2 size={16} />
                  </button>
                </Card>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowPicker(true)}
            style={{
              width: '100%', padding: 16, borderRadius: 10, border: '2px dashed var(--border)',
              background: 'transparent', color: 'var(--muted)', fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <FiPlus size={16} /> Add Exercise
          </button>

          {currentWorkout.length > 0 && (
            <button
              onClick={handleSaveWorkout}
              disabled={!workoutName}
              style={{
                width: '100%', marginTop: 16, padding: 14, borderRadius: 10, border: 'none',
                background: workoutName ? 'var(--accent)' : 'var(--subtle)',
                color: workoutName ? '#000' : 'var(--muted)', fontSize: 14, fontWeight: 600,
                cursor: workoutName ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <FiSave size={16} /> Save Workout
            </button>
          )}
        </div>

        <ExercisePicker isOpen={showPicker} onClose={() => setShowPicker(false)} onSelect={handleAddExercise} />
      </div>
    );
  }

  if (view === 'session' && activeSession && currentWorkout.length > 0) {
    const currentExercise = currentWorkout[currentExerciseIndex];
    const completedSets = activeSession.exercises[currentExerciseIndex]?.sets?.length || 0;

    return (
      <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>{activeSession.workoutName || 'Workout'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{formatTime(elapsedTime)} elapsed</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={cancelSession} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>
              Cancel
            </button>
            <button onClick={finishSession} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Finish
            </button>
          </div>
        </div>

        {restTimer !== null && restTimer > 0 && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 80, fontFamily: 'var(--font-display)', color: 'var(--accent)', marginBottom: 16 }}>{restTimer}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>Rest</div>
              <button onClick={() => setRestTimer(null)} style={{ marginTop: 24, padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontWeight: 600 }}>
                Skip
              </button>
            </div>
          </div>
        )}

        <div style={s(0)}>
          <Card style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36 }}>{currentExercise.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Set {currentSetIndex + 1} of {currentExercise.sets} · {currentExercise.reps} reps · {currentExercise.restSeconds}s rest
                </div>
              </div>
              <div style={{
                background: completedSets === currentExercise.sets ? 'var(--accent)' : 'var(--subtle)',
                color: completedSets === currentExercise.sets ? '#000' : 'var(--muted)',
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              }}>
                {completedSets} / {currentExercise.sets}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: i < completedSets ? 'var(--accent)' : i === currentSetIndex ? 'rgba(200,255,0,0.4)' : 'var(--subtle)',
                }} />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { reps: parseInt(currentExercise.reps), weight: 0 },
                { reps: parseInt(currentExercise.reps) - 2, weight: 0 },
                { reps: parseInt(currentExercise.reps) + 2, weight: 0 },
                { reps: parseInt(currentExercise.reps), weight: 5 },
              ].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => logSet(preset.reps, preset.weight)}
                  style={{
                    padding: 16, borderRadius: 8, border: 'none',
                    background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 600 }}>{preset.reps}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{preset.weight > 0 ? `+${preset.weight}kg` : 'reps'}</span>
                </button>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            {currentWorkout.map((ex, i) => (
              <div
                key={i}
                onClick={() => { setCurrentExerciseIndex(i); setCurrentSetIndex(0); }}
                style={{
                  padding: '10px 14px', borderRadius: 8, whiteSpace: 'nowrap',
                  background: i === currentExerciseIndex ? 'var(--accent)' : 'var(--surface)',
                  color: i === currentExerciseIndex ? '#000' : 'var(--muted)',
                  fontSize: 12, cursor: 'pointer',
                }}
              >
                {i + 1}. {ex.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20, ...s(0) }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,52px)', lineHeight: 0.9, letterSpacing: '0.02em' }}>
          TRAIN
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
          Workouts · Start a session
        </div>
      </div>

      <div style={s(0.1)}>
        <button
          onClick={() => { setCurrentWorkout([]); setWorkoutName(''); setView('builder'); }}
          style={{
            width: '100%', padding: 20, borderRadius: 12, border: '2px dashed var(--accent)',
            background: 'transparent', color: 'var(--accent)', fontSize: 15, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 20,
          }}
        >
          <FiPlus size={18} /> Create New Workout
        </button>
      </div>

      <div style={s(0.15)}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Quick Templates
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Push', color: '#ff6b6b' },
            { label: 'Pull', color: '#4ecdc4' },
            { label: 'Legs', color: '#45b7d1' },
            { label: 'Upper', color: '#96ceb4' },
            { label: 'Lower', color: '#ffeaa7' },
            { label: 'Full', color: '#dfe6e9' },
          ].map((template) => (
            <button
              key={template.label}
              onClick={() => {
                const templateExercises: Record<string, { name: string; sets: number; reps: string; restSeconds: number }[]> = {
                  Push: [
                    { name: 'Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
                    { name: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 60 },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', restSeconds: 60 },
                    { name: 'Lateral Raises', sets: 3, reps: '15-20', restSeconds: 45 },
                    { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', restSeconds: 45 },
                  ],
                  Pull: [
                    { name: 'Deadlift', sets: 4, reps: '5-8', restSeconds: 120 },
                    { name: 'Pull-ups', sets: 3, reps: '6-12', restSeconds: 90 },
                    { name: 'Barbell Rows', sets: 3, reps: '8-12', restSeconds: 60 },
                    { name: 'Face Pulls', sets: 3, reps: '15-20', restSeconds: 45 },
                    { name: 'Bicep Curls', sets: 3, reps: '10-15', restSeconds: 45 },
                  ],
                  Legs: [
                    { name: 'Squats', sets: 4, reps: '6-10', restSeconds: 120 },
                    { name: 'Romanian Deadlift', sets: 3, reps: '8-12', restSeconds: 90 },
                    { name: 'Leg Press', sets: 3, reps: '10-15', restSeconds: 60 },
                    { name: 'Leg Curls', sets: 3, reps: '10-15', restSeconds: 45 },
                    { name: 'Calf Raises', sets: 3, reps: '15-20', restSeconds: 45 },
                  ],
                  Upper: [
                    { name: 'Bench Press', sets: 3, reps: '8-12', restSeconds: 90 },
                    { name: 'Pull-ups', sets: 3, reps: '6-12', restSeconds: 90 },
                    { name: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 60 },
                    { name: 'Barbell Rows', sets: 3, reps: '8-12', restSeconds: 60 },
                    { name: 'Bicep Curls', sets: 2, reps: '12-15', restSeconds: 45 },
                  ],
                  Lower: [
                    { name: 'Squats', sets: 4, reps: '8-12', restSeconds: 120 },
                    { name: 'Romanian Deadlift', sets: 3, reps: '10-15', restSeconds: 90 },
                    { name: 'Leg Press', sets: 3, reps: '12-15', restSeconds: 60 },
                    { name: 'Leg Curls', sets: 3, reps: '12-15', restSeconds: 45 },
                    { name: 'Planks', sets: 3, reps: '60s', restSeconds: 45 },
                  ],
                  Full: [
                    { name: 'Squats', sets: 3, reps: '10-12', restSeconds: 90 },
                    { name: 'Bench Press', sets: 3, reps: '10-12', restSeconds: 90 },
                    { name: 'Pull-ups', sets: 3, reps: '6-12', restSeconds: 90 },
                    { name: 'Overhead Press', sets: 3, reps: '10-12', restSeconds: 60 },
                    { name: 'Dumbbell Rows', sets: 3, reps: '10-12', restSeconds: 60 },
                    { name: 'Planks', sets: 3, reps: '45s', restSeconds: 45 },
                  ],
                };
                const exercises = (templateExercises[template.label] || []).map((ex, i) => ({
                  id: `template-${i}`,
                  ...ex,
                }));
                setCurrentWorkout(exercises);
                setWorkoutName(`${template.label} Day`);
                setView('builder');
              }}
              style={{
                padding: 14, borderRadius: 10, border: '1px solid var(--border)',
                background: `${template.color}15`, color: 'var(--text)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              {template.label} Day
            </button>
          ))}
        </div>
      </div>

      <div style={s(0.2)}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Your Workouts
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading...</div>
        ) : workouts.length === 0 ? (
          <Card style={{ padding: 30, textAlign: 'center', color: 'var(--muted)' }}>
            No workouts yet. Create your first workout above.
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workouts.map(workout => {
              const isExpanded = expandedWorkoutId === workout._id;
              const currentEx = workout.exercises[expandedExerciseIndex];
              const nextEx = workout.exercises[expandedExerciseIndex + 1];
              const totalEx = workout.exercises.length;
              
              return (
                <Card key={workout._id} style={{ padding: 0, overflow: 'hidden' }}>
                  {!isExpanded ? (
                    <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500 }}>{workout.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {workout.exercises.length} exercises
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setExpandedWorkoutId(workout._id);
                          setExpandedExerciseIndex(0);
                        }}
                        style={{
                          padding: '10px 16px', borderRadius: 8, border: 'none',
                          background: 'var(--accent)', color: '#000', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <FiPlay size={12} /> Start
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600 }}>{workout.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>
                            Exercise {expandedExerciseIndex + 1} of {totalEx}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedWorkoutId(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                      
                      {currentEx && (
                        <div style={{ padding: 20 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>{currentEx.exerciseName}</div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                            {currentEx.sets} x {currentEx.reps} · {currentEx.restSeconds}s rest
                          </div>
                          
                          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {Array.from({ length: currentEx.sets }).map((_, i) => (
                              <div key={i} style={{
                                flex: 1, height: 8, borderRadius: 4,
                                background: 'var(--subtle)',
                              }} />
                            ))}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                            {[
                              { reps: parseInt(currentEx.reps) || 10, weight: 0 },
                              { reps: (parseInt(currentEx.reps) || 10) - 2, weight: 0 },
                              { reps: (parseInt(currentEx.reps) || 10) + 2, weight: 0 },
                              { reps: parseInt(currentEx.reps) || 10, weight: 5 },
                            ].map((preset, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (expandedExerciseIndex < totalEx - 1) {
                                    setExpandedExerciseIndex(expandedExerciseIndex + 1);
                                  }
                                }}
                                style={{
                                  padding: 14, borderRadius: 8, border: 'none',
                                  background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                }}
                              >
                                <span style={{ fontSize: 18, fontWeight: 600 }}>{preset.reps}</span>
                                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{preset.weight > 0 ? `+${preset.weight}kg` : 'reps'}</span>
                              </button>
                            ))}
                          </div>
                          
                          {nextEx && (
                            <div style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next</span>
                              <span style={{ fontSize: 13, color: 'var(--text)' }}>{nextEx.name}</span>
                              <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>{nextEx.sets} x {nextEx.reps}</span>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            {expandedExerciseIndex > 0 && (
                              <button
                                onClick={() => setExpandedExerciseIndex(expandedExerciseIndex - 1)}
                                style={{
                                  flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--border)',
                                  background: 'transparent', color: 'var(--text)', cursor: 'pointer',
                                  fontSize: 13, fontWeight: 500,
                                }}
                              >
                                Previous
                              </button>
                            )}
                            <button
                              onClick={() => startWorkout(workout)}
                              style={{
                                flex: 1, padding: 12, borderRadius: 8, border: 'none',
                                background: 'var(--accent)', color: '#000', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600,
                              }}
                            >
                              {expandedExerciseIndex === totalEx - 1 ? 'Finish' : 'Next Exercise'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

        <div style={s(0.25)}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM7.778 4.583l10.059 17.944H9.916L7.778 9.167 5.64 22.527H.615L7.778 4.583z"/>
          </svg>
          Strava Activities
          <button 
            onClick={() => fetchStravaWorkouts(true)}
            disabled={stravaLoading}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <FiRefreshCw size={12} style={{ animation: stravaLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
        
        {stravaLoading ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>Loading...</div>
        ) : stravaWorkouts.length === 0 ? (
          <Card style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No Strava activities yet. Connect Strava in Devices to sync your activities.
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stravaWorkouts.slice(0, 10).map(workout => (
              <Card key={workout.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, 
                    background: 'var(--accent)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', fontSize: 10, fontWeight: 600
                  }}>
                    {workout.type?.slice(0, 3).toUpperCase() || 'ACT'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{workout.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {workout.start_date ? new Date(workout.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
                      {Math.floor(workout.duration / 60)}:{(workout.duration % 60).toString().padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Duration</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--blue)' }}>
                      {(workout.distance / 1000).toFixed(1)} km
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Distance</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--orange)' }}>
                      {workout.calories || '--'}
                      {workout.estimatedCalories && <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 4 }}>(est)</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Kcal</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--purple)' }}>
                      {Math.round(workout.elevation)} m
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Elevation</div>
                  </div>
                  {(workout.avgSpeed || 0) > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--blue)' }}>
                        {((workout.avgSpeed || 0) * 3.6).toFixed(1)} km/h
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Avg Speed</div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AiNudge style={{ marginTop: 24 }}>
        Ready to train? Create a workout or start an ad-hoc session. Your AI coach will provide real-time form feedback during exercises.
      </AiNudge>
    </div>
  );
}
