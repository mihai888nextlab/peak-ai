'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui';
import { FiRefreshCw, FiExternalLink, FiSmartphone, FiArrowRight, FiCheck, FiX, FiClock } from 'react-icons/fi';

interface Provider {
  provider: string;
  name: string;
  has_cloud_api: boolean;
  is_enabled: boolean;
}

interface Connection {
  id: string;
  user_id: string;
  provider: string;
  status: 'active' | 'revoked' | 'expired';
  last_synced_at: string | null;
  created_at: string;
}

const s = (delay: number): React.CSSProperties => ({
  animation: `fadeUp 0.4s ease ${delay}s both`,
});

const PROVIDER_CONFIG: Record<string, { 
  type: 'cloud_oauth' | 'mobile_sdk' | 'xml_import';
  description: string; 
  features: string[];
  steps?: string[];
}> = {
  strava: {
    type: 'cloud_oauth',
    description: 'Connect your Strava account to sync activities, routes, and workouts',
    features: ['Activities', 'Workouts', 'GPS Routes', 'Performance Stats'],
    steps: ['Click Connect below', 'Log in to Strava', 'Authorize PeakAI'],
  },
  garmin: {
    type: 'cloud_oauth',
    description: 'Connect Garmin devices to sync health and fitness data',
    features: ['Heart Rate', 'Sleep', 'Steps', 'Workouts', 'Body Battery'],
    steps: ['Click Connect below', 'Log in to Garmin', 'Authorize PeakAI'],
  },
  polar: {
    type: 'cloud_oauth',
    description: 'Connect Polar devices to sync workout and activity data',
    features: ['Workouts', 'Activity', 'Heart Rate (during exercise)'],
    steps: ['Click Connect below', 'Log in to Polar', 'Authorize PeakAI'],
  },
  suunto: {
    type: 'cloud_oauth',
    description: 'Connect Suunto devices to sync comprehensive fitness data',
    features: ['Heart Rate', 'Sleep', 'Steps', 'Recovery', 'Workouts'],
    steps: ['Click Connect below', 'Log in to Suunto', 'Authorize PeakAI'],
  },
  whoop: {
    type: 'cloud_oauth',
    description: 'Connect Whoop to sync recovery and strain data',
    features: ['Recovery Score', 'Strain', 'Sleep', 'Workouts'],
    steps: ['Click Connect below', 'Log in to Whoop', 'Authorize PeakAI'],
  },
  apple: {
    type: 'xml_import',
    description: 'Import your Apple Health data as an XML export',
    features: ['Heart Rate', 'Sleep', 'Workouts', 'Steps', 'All Health Data'],
    steps: ['Open Health app on iPhone', 'Tap your profile', 'Export All Health Data', 'Upload ZIP below'],
  },
  samsung: {
    type: 'mobile_sdk',
    description: 'Samsung Health integration via mobile app (coming soon)',
    features: ['Steps', 'Heart Rate', 'Sleep', 'Workouts'],
  },
  google: {
    type: 'mobile_sdk',
    description: 'Google Health Connect integration via mobile app (coming soon)',
    features: ['Steps', 'Heart Rate', 'Sleep', 'Workouts'],
  },
};

export default function DevicesScreen() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: boolean; message: string} | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error'; message: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    
    if (connected) {
      setNotification({ type: 'success', message: `${connected} connected successfully!` });
      window.history.replaceState({}, '', '/app/devices');
    } else if (error) {
      setNotification({ type: 'error', message: error });
      window.history.replaceState({}, '', '/app/devices');
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [providersRes, userRes] = await Promise.all([
        fetch('/api/openwearables/providers?path=api/v1/oauth/providers'),
        fetch('/api/openwearables/user?action=connections'),
      ]);
      
      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data);
      }
      
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.connections) {
          setConnections(userData.connections);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectDevice = useCallback(async (provider: string) => {
    setConnecting(provider);
    try {
      const res = await fetch('/api/openwearables/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      
      if (res.ok && data.authorization_url) {
        const isPlaceholder = data.authorization_url.includes('your-') || 
                             data.authorization_url.includes('public-client-id') || 
                             data.authorization_url.includes('private-');
        
        if (isPlaceholder) {
          alert(`OAuth credentials not configured for ${provider}\n\nThe app owner needs to add real API credentials to enable this connection.`);
          setConnecting(null);
          return;
        }
        
        window.open(data.authorization_url, '_blank', 'width=600,height=700');
        
        const checkConnection = setInterval(async () => {
          const connRes = await fetch('/api/openwearables/user?action=connections');
          if (connRes.ok) {
            const connData = await connRes.json();
            if (connData.connections?.some((c: Connection) => c.provider === provider && c.status === 'active')) {
              clearInterval(checkConnection);
              setConnections(connData.connections);
              setNotification({ type: 'success', message: `${provider} connected successfully!` });
            }
          }
        }, 3000);
        
        setTimeout(() => clearInterval(checkConnection), 60000);
      } else {
        const errorMsg = data.error || data.details || 'Connection failed';
        setNotification({ type: 'error', message: errorMsg });
      }
    } catch (err) {
      console.error('Connection error:', err);
      setNotification({ type: 'error', message: 'Connection failed. Please try again.' });
    } finally {
      setConnecting(null);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/openwearables/import?provider=apple', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        setImportResult({ success: true, message: `Successfully imported ${file.name}` });
      } else {
        setImportResult({ success: false, message: data.error || 'Import failed' });
      }
    } catch (err) {
      setImportResult({ success: false, message: 'Import failed. Please try again.' });
    } finally {
      setImporting(false);
    }
  };

  const syncDevice = useCallback(async (provider: string) => {
    setSyncing(provider);
    try {
      const res = await fetch('/api/openwearables/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, data_type: 'all' }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setNotification({ type: 'success', message: `Synced ${provider} data successfully!` });
      } else {
        setNotification({ type: 'error', message: data.error || 'Sync failed' });
      }
    } catch (err) {
      console.error('Sync error:', err);
      setNotification({ type: 'error', message: 'Sync failed. Please try again.' });
    } finally {
      setSyncing(null);
    }
  }, []);

  const getStatusBadge = (provider: Provider) => {
    const config = PROVIDER_CONFIG[provider.provider];
    if (!config) return null;
    
    const connection = connections.find(c => c.provider === provider.provider && c.status === 'active');
    
    if (connection) {
      return (
        <span style={{ 
          padding: '3px 10px', 
          borderRadius: 20, 
          background: 'rgba(0,255,0,0.15)',
          color: '#0f0',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          Connected
        </span>
      );
    }
    
    if (config.type === 'cloud_oauth' && provider.is_enabled) {
      return (
        <span style={{ 
          padding: '3px 10px', 
          borderRadius: 20, 
          background: 'rgba(0,255,0,0.1)',
          color: '#0f0',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          OAuth Ready
        </span>
      );
    }
    
    if (config.type === 'xml_import') {
      return (
        <span style={{ 
          padding: '3px 10px', 
          borderRadius: 20, 
          background: 'rgba(200,255,0,0.1)',
          color: 'var(--accent)',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          Import
        </span>
      );
    }
    
    return (
      <span style={{ 
        padding: '3px 10px', 
        borderRadius: 20, 
        background: 'rgba(100,100,100,0.2)',
        color: 'var(--muted)',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
      }}>
        Coming Soon
      </span>
    );
  };

  const renderConnectButton = (provider: Provider) => {
    const config = PROVIDER_CONFIG[provider.provider];
    if (!config) return null;

    const connection = connections.find(c => c.provider === provider.provider && c.status === 'active');
    
    if (connection && config.type === 'cloud_oauth') {
      return (
        <button
          onClick={() => syncDevice(provider.provider)}
          disabled={syncing === provider.provider}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: syncing === provider.provider ? 'var(--subtle)' : 'var(--accent)',
            color: syncing === provider.provider ? 'var(--muted)' : '#000',
            fontSize: 12,
            fontWeight: 600,
            cursor: syncing === provider.provider ? 'wait' : 'pointer',
          }}
        >
          {syncing === provider.provider ? (
            <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              Sync
              <FiRefreshCw size={12} />
            </>
          )}
        </button>
      );
    }

    if (config.type === 'cloud_oauth' && provider.is_enabled) {
      return (
        <button
          onClick={() => connectDevice(provider.provider)}
          disabled={connecting === provider.provider}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: connecting === provider.provider ? 'var(--subtle)' : 'var(--accent)',
            color: connecting === provider.provider ? 'var(--muted)' : '#000',
            fontSize: 12,
            fontWeight: 600,
            cursor: connecting === provider.provider ? 'wait' : 'pointer',
          }}
        >
          {connecting === provider.provider ? (
            <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              Connect
              <FiExternalLink size={12} />
            </>
          )}
        </button>
      );
    }

    if (config.type === 'xml_import') {
      return (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Import
          <FiArrowRight size={12} />
        </button>
      );
    }

    return (
      <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <FiClock size={12} />
        Coming Soon
      </span>
    );
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: 900 }}>
      {notification && (
        <div style={{
          marginBottom: 20,
          padding: '12px 16px',
          borderRadius: 8,
          background: notification.type === 'success' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {notification.type === 'success' ? <FiCheck size={16} color="#0f0" /> : <FiX size={16} color="#f00" />}
          <span style={{ color: notification.type === 'success' ? '#0f0' : '#f00', fontSize: 13 }}>
            {notification.message}
          </span>
          <button
            onClick={() => setNotification(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      <div style={s(0)}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--text)',
          margin: 0,
        }}>
          Connect Devices
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
          Sync your fitness data from wearables and health apps
        </p>
      </div>

      <div style={s(1)}>
        <div style={{ marginTop: 24, marginBottom: 12 }}>
          <h2 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Cloud Connect (OAuth)
          </h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {providers.filter(p => PROVIDER_CONFIG[p.provider]?.type === 'cloud_oauth').map((provider) => {
            const config = PROVIDER_CONFIG[provider.provider];
            const isExpanded = expanded === provider.provider;
            
            return (
              <Card key={provider.provider} style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpanded(isExpanded ? null : provider.provider)}
                  style={{ padding: 16, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text)',
                    }}>
                      <FiSmartphone size={18} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                        {provider.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                        {(() => {
                          const conn = connections.find(c => c.provider === provider.provider && c.status === 'active');
                          if (conn?.last_synced_at) {
                            const date = new Date(conn.last_synced_at);
                            return `Last synced: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                          }
                          return config?.description;
                        })()}
                      </div>
                    </div>
                    
                    {renderConnectButton(provider)}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {config?.features.slice(0, 4).map((feature, i) => (
                      <span key={i} style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'var(--subtle)',
                        fontSize: 10,
                        color: 'var(--muted)',
                      }}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {isExpanded && config?.steps && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--subtle)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 500 }}>
                      How to connect:
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'var(--text)', lineHeight: 1.6 }}>
                      {config.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div style={s(2)}>
        <div style={{ marginTop: 32, marginBottom: 12 }}>
          <h2 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Mobile & Import
          </h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {providers.filter(p => PROVIDER_CONFIG[p.provider]?.type !== 'cloud_oauth').map((provider) => {
            const config = PROVIDER_CONFIG[provider.provider];
            const isExpanded = expanded === provider.provider;
            
            return (
              <Card key={provider.provider} style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpanded(isExpanded ? null : provider.provider)}
                  style={{ padding: 16, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text)',
                    }}>
                      <FiSmartphone size={18} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                        {provider.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                        {config?.description}
                      </div>
                    </div>
                    
                    {getStatusBadge(provider)}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {config?.features.slice(0, 4).map((feature, i) => (
                      <span key={i} style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'var(--subtle)',
                        fontSize: 10,
                        color: 'var(--muted)',
                      }}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {isExpanded && config?.steps && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--subtle)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 500 }}>
                      How to {config.type === 'xml_import' ? 'import' : 'connect'}:
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'var(--text)', lineHeight: 1.6 }}>
                      {config.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>

                    {provider.provider === 'apple' && (
                      <div style={{ marginTop: 12 }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".xml,.zip"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          disabled={importing}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#000',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: importing ? 'wait' : 'pointer',
                          }}
                        >
                          {importing ? 'Importing...' : 'Select ZIP File'}
                        </button>
                        {importResult && (
                          <div style={{ 
                            marginTop: 8, 
                            padding: 8, 
                            borderRadius: 4,
                            background: importResult.success ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                            color: importResult.success ? '#0f0' : '#f00',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                            {importResult.success ? <FiCheck size={12} /> : <FiX size={12} />}
                            {importResult.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div style={s(3)}>
        <div style={{ marginTop: 32, padding: 16, background: 'var(--subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 8 }}>
            Need help connecting?
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            Cloud providers (Strava, Garmin, Polar, Suunto, Whoop) use OAuth - simply click Connect and authorize.
            <br />
            Apple Health requires exporting data from the Health app first.
            <br />
            Samsung and Google Health Connect will be available via the PeakAI mobile app.
          </div>
        </div>
      </div>
    </div>
  );
}
