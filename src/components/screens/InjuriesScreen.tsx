'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui';
import { FiPlus, FiX, FiCheck, FiAlertCircle, FiActivity, FiTrash2, FiZap } from 'react-icons/fi';

interface Injury {
  _id: string;
  name: string;
  bodyPart: string;
  description: string;
  status: 'active' | 'recovered' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
  recoveryDate?: string;
  notes: string;
}

const BODY_PARTS = [
  { id: 'Shoulder', label: 'Shoulder', x: 25, y: 20 },
  { id: 'Knee', label: 'Knee', x: 30, y: 65 },
  { id: 'Back', label: 'Back', x: 50, y: 30 },
  { id: 'Ankle', label: 'Ankle', x: 28, y: 82 },
  { id: 'Wrist', label: 'Wrist', x: 15, y: 38 },
  { id: 'Hip', label: 'Hip', x: 40, y: 45 },
  { id: 'Elbow', label: 'Elbow', x: 18, y: 32 },
  { id: 'Neck', label: 'Neck', x: 45, y: 12 },
  { id: 'Calf', label: 'Calf', x: 28, y: 75 },
  { id: 'Quad', label: 'Quad', x: 35, y: 55 },
  { id: 'Hamstring', label: 'Hamstring', x: 65, y: 55 },
];

const SEVERITY_COLORS = {
  mild: 'var(--blue)',
  moderate: 'var(--orange)',
  severe: 'var(--red)',
};

export default function InjuriesScreen() {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    bodyPart: '',
    description: '',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe',
    notes: '',
  });

  const fetchInjuries = async () => {
    try {
      const res = await fetch('/api/injuries');
      const data = await res.json();
      setInjuries(data.injuries || []);
    } catch (err) {
      console.error('Failed to fetch injuries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInjuries();
  }, []);

  const handleQuickAdd = (bodyPart: string) => {
    setSelectedBodyPart(bodyPart);
    setForm({
      ...form,
      bodyPart: bodyPart,
      name: `${bodyPart} pain`,
    });
    setShowQuickAdd(false);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.bodyPart) return;

    try {
      await fetch('/api/injuries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...form }),
      });
      setForm({ name: '', bodyPart: '', description: '', severity: 'moderate', notes: '' });
      setShowForm(false);
      setSelectedBodyPart(null);
      fetchInjuries();
    } catch (err) {
      console.error('Failed to create injury:', err);
    }
  };

  const handleRecover = async (injuryId: string) => {
    try {
      await fetch('/api/injuries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recover', injuryId }),
      });
      fetchInjuries();
    } catch (err) {
      console.error('Failed to recover injury:', err);
    }
  };

  const handleDelete = async (injuryId: string) => {
    try {
      await fetch('/api/injuries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', injuryId }),
      });
      fetchInjuries();
    } catch (err) {
      console.error('Failed to delete injury:', err);
    }
  };

  const activeInjuries = injuries.filter(i => i.status === 'active');
  const recoveredInjuries = injuries.filter(i => i.status === 'recovered');
  const chronicInjuries = injuries.filter(i => i.status === 'chronic');

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease 0.05s both' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,52px)', lineHeight: 0.9, letterSpacing: '0.02em' }}>
          INJURIES
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
          Track & manage your injuries
        </div>
      </div>

      {activeInjuries.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--red)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Active Injuries ({activeInjuries.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeInjuries.map((injury, i) => (
              <Card key={injury._id} style={{ padding: '16px 18px', borderLeft: `3px solid ${SEVERITY_COLORS[injury.severity]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{injury.name}</span>
                      <span style={{ 
                        fontSize: 10, fontFamily: 'var(--font-mono)', 
                        padding: '2px 6px', borderRadius: 4,
                        background: SEVERITY_COLORS[injury.severity] + '20',
                        color: SEVERITY_COLORS[injury.severity],
                        textTransform: 'uppercase'
                      }}>
                        {injury.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                      {injury.bodyPart} {injury.description && `• ${injury.description}`}
                    </div>
                    {injury.notes && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 4 }}>
                        {injury.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleRecover(injury._id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 12px', borderRadius: 8,
                        background: 'var(--accent)', border: 'none',
                        color: '#000', fontSize: 11, fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <FiCheck size={14} />
                      Recovered
                    </button>
                    <button
                      onClick={() => handleDelete(injury._id)}
                      style={{
                        background: 'none', border: 'none',
                        cursor: 'pointer', padding: 8,
                        color: 'var(--muted)',
                      }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {chronicInjuries.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--orange)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Chronic Issues ({chronicInjuries.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chronicInjuries.map((injury) => (
              <Card key={injury._id} style={{ padding: '16px 18px', borderLeft: '3px solid var(--orange)', opacity: 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{injury.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--orange)' }}>Chronic</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {injury.bodyPart}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(injury._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--muted)' }}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showQuickAdd && !showForm && (
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Where does it hurt?</span>
            <button onClick={() => setShowQuickAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
              <FiX size={18} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BODY_PARTS.map((part) => (
              <button
                key={part.id}
                onClick={() => handleQuickAdd(part.label)}
                style={{
                  padding: '10px 16px', borderRadius: 20,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 12,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {part.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => { setShowQuickAdd(false); setShowForm(true); }}
            style={{
              marginTop: 12, padding: '10px', width: '100%', borderRadius: 8,
              background: 'transparent', border: '1px dashed var(--border)',
              color: 'var(--muted)', fontSize: 12, cursor: 'pointer',
            }}
          >
            Or enter details manually →
          </button>
        </Card>
      )}

      {showForm ? (
        <Card style={{ padding: 20 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedBodyPart ? `Add ${selectedBodyPart} injury` : 'New Injury'}</span>
              <button type="button" onClick={() => { setShowForm(false); setSelectedBodyPart(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <FiX size={18} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Body Part *</label>
                <select
                  value={form.bodyPart}
                  onChange={e => setForm({ ...form, bodyPart: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 13,
                  }}
                >
                  <option value="">Select body part</option>
                  {BODY_PARTS.map(part => (
                    <option key={part.id} value={part.label}>{part.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Injury Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Torn ACL, Muscle strain, Tendinitis"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 13,
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Severity</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['mild', 'moderate', 'severe'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setForm({ ...form, severity: sev })}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 8,
                        background: form.severity === sev ? SEVERITY_COLORS[sev] + '20' : 'var(--surface)',
                        border: `1px solid ${form.severity === sev ? SEVERITY_COLORS[sev] : 'var(--border)'}`,
                        color: form.severity === sev ? SEVERITY_COLORS[sev] : 'var(--muted)',
                        fontSize: 12, textTransform: 'capitalize', cursor: 'pointer',
                      }}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="How did it happen? Any treatment?"
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 13, resize: 'none',
                  }}
                />
              </div>
              
              <button
                type="submit"
                style={{
                  padding: '12px', borderRadius: 8,
                  background: 'var(--accent)', border: 'none',
                  color: '#000', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', marginTop: 8,
                }}
              >
                Save Injury
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowQuickAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', flex: 1,
              background: 'var(--red)', border: 'none',
              borderRadius: 14, color: '#fff', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <FiZap size={18} />
            Quick Report Pain
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', flex: 1,
              background: 'var(--card)', border: '1.5px dashed var(--border)',
              borderRadius: 14, color: 'var(--text)', fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <FiPlus size={18} />
            Add Injury
          </button>
        </div>
      )}

      {recoveredInjuries.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Recovered ({recoveredInjuries.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recoveredInjuries.map((injury) => (
              <div key={injury._id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--subtle)', opacity: 0.6,
              }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text)', textDecoration: 'line-through' }}>
                    {injury.name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
                    {injury.bodyPart}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(injury._id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)' }}
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
