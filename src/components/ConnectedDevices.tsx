'use client';

import { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiSmartphone } from 'react-icons/fi';

interface Provider {
  provider: string;
  name: string;
  has_cloud_api: boolean;
  is_enabled: boolean;
  icon_url: string;
}

interface Props {
  apiUrl?: string;
}

export default function ConnectedDevices({ apiUrl }: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/openwearables/providers?path=api/v1/oauth/providers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProviders(data);
    } catch (err) {
      setError('OpenWearables unavailable');
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    // Use FiSmartphone as fallback for all providers
    return <FiSmartphone size={14} />;
  };

  if (loading) {
    return (
      <>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          padding: '0 20px', marginBottom: 6, marginTop: 16,
        }}>Devices</div>
        <div style={{ padding: '9px 20px', opacity: 0.5 }}>
          <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          padding: '0 20px', marginBottom: 6, marginTop: 16,
        }}>Devices</div>
        <div style={{ padding: '9px 20px', fontSize: 11, color: 'var(--muted)' }}>
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        padding: '0 20px', marginBottom: 6, marginTop: 16,
      }}>Devices</div>
      {providers.map(p => (
        <div key={p.provider} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '9px 20px',
          opacity: p.is_enabled ? 1 : 0.5,
          cursor: 'pointer',
        }}>
          <span style={{ fontSize: 15, width: 22, textAlign: 'center' }}>
            {getProviderIcon(p.provider)}
          </span>
          <span style={{ fontSize: 12, color: '#888', flex: 1 }}>{p.name}</span>
          <FiCheck size={12} color="var(--accent)" />
        </div>
      ))}
    </>
  );
}
