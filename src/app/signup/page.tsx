'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiUser, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { TerrainIcon } from '@/components/ui';

export default function SignupPage() {
  const { status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/app');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Registration successful but login failed');
      } else {
        router.push('/app');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/app' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
            <TerrainIcon size={40} color="var(--accent)" />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              letterSpacing: '0.1em',
              color: 'var(--text)',
            }}>PEAK</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            color: 'var(--text)',
            marginBottom: 8,
          }}>Create Account</h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--muted)',
            letterSpacing: '0.05em',
          }}>Start your athletic intelligence journey</p>
        </div>

        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 32,
        }}>
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12,
              padding: '14px 20px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: 24,
              transition: 'all 0.2s',
            }}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 24,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'var(--red)15',
                border: '1px solid var(--red)30',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 20,
                color: 'var(--red)',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>Name</label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '0 16px',
                transition: 'all 0.2s',
              }}>
                <FiUser size={18} color="var(--muted)" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    padding: '14px 12px',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>Email</label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '0 16px',
                transition: 'all 0.2s',
              }}>
                <FiMail size={18} color="var(--muted)" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    padding: '14px 12px',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>Password</label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '0 16px',
                transition: 'all 0.2s',
              }}>
                <FiLock size={18} color="var(--muted)" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    padding: '14px 12px',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '16px 20px',
                background: loading ? 'var(--subtle)' : 'var(--accent)',
                border: 'none',
                borderRadius: 10,
                color: '#000',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                letterSpacing: '0.05em',
                cursor: loading ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Creating account...' : (
                <>
                  CREATE ACCOUNT
                  <FiArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 14,
          color: 'var(--muted)',
        }}>
          Already have an account?{' '}
          <Link href="/login" style={{
            color: 'var(--accent)',
            textDecoration: 'none',
            fontWeight: 500,
          }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
