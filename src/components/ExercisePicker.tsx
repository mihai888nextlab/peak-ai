'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiPlus, FiCheck } from 'react-icons/fi';

interface Exercise {
  _id: string;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  formCues: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: { id: string; name: string; sets: number; reps: string; restSeconds: number }) => void;
}

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Glutes', 'Core', 'Calves'];

export default function ExercisePicker({ isOpen, onClose, onSelect }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [rest, setRest] = useState('60');

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/exercises', window.location.origin);
      if (search) url.searchParams.set('q', search);
      if (selectedMuscle) url.searchParams.set('muscle', selectedMuscle);
      
      const res = await fetch(url);
      const data = await res.json();
      setExercises(data.exercises || []);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchExercises, 300);
    return () => clearTimeout(debounce);
  }, [search, selectedMuscle]);

  const handleAdd = () => {
    if (selectedExercise) {
      onSelect({
        id: selectedExercise._id,
        name: selectedExercise.name,
        sets: parseInt(sets) || 3,
        reps: reps || '10',
        restSeconds: parseInt(rest) || 60,
      });
      setSelectedExercise(null);
      setSets('3');
      setReps('10');
      setRest('60');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      
      <div style={{
        position: 'relative', background: 'var(--card)', borderRadius: 16,
        width: '90%', maxWidth: 700, maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Add Exercise</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            <FiX size={20} />
          </button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {MUSCLE_GROUPS.map(muscle => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: selectedMuscle === muscle ? 'var(--accent)' : 'var(--subtle)',
                  color: selectedMuscle === muscle ? '#000' : 'var(--muted)',
                  fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading...</div>
          ) : exercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No exercises found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {exercises.map(ex => (
                <div
                  key={ex._id}
                  onClick={() => setSelectedExercise(ex)}
                  style={{
                    padding: 12, borderRadius: 8, cursor: 'pointer',
                    background: selectedExercise?._id === ex._id ? 'rgba(200,255,0,0.1)' : 'var(--surface)',
                    border: selectedExercise?._id === ex._id ? '1px solid var(--accent)' : '1px solid transparent',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{ex.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {ex.muscleGroups.slice(0, 2).map(m => (
                      <span key={m} style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--subtle)', padding: '2px 6px', borderRadius: 4 }}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedExercise && (
          <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--subtle)' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Form cues for {selectedExercise.name}:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selectedExercise.formCues.slice(0, 3).map((cue, i) => (
                  <span key={i} style={{ fontSize: 10, color: 'var(--accent)', background: 'rgba(200,255,0,0.1)', padding: '3px 8px', borderRadius: 4 }}>{cue}</span>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Sets</label>
                <input
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Reps</label>
                <input
                  type="text"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="10 or 8-12"
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Rest (sec)</label>
                <input
                  type="number"
                  value={rest}
                  onChange={(e) => setRest(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
            </div>
            
            <button
              onClick={handleAdd}
              style={{
                width: '100%', padding: 12, borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#000', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <FiPlus size={16} /> Add to Workout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
