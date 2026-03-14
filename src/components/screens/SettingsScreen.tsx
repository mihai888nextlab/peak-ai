'use client';

import { useState } from 'react';
import { Card } from '../ui';
import { FiUser, FiBell, FiMoon, FiShield, FiLogOut, FiCheck, FiMail, FiKey, FiExternalLink, FiAlertCircle } from 'react-icons/fi';

const s = (delay: number): React.CSSProperties => ({
  animation: `fadeUp 0.4s ease ${delay}s both`,
});

interface Settings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
}

interface Props {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onLogout: () => void;
}

function SettingToggle({ 
  icon: Icon, 
  label, 
  description, 
  enabled, 
  onChange 
}: { 
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '14px 0',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ 
          width: 36, height: 36, borderRadius: 10, 
          background: enabled ? 'var(--accent)15' : 'var(--subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: enabled ? 'var(--accent)' : 'var(--muted)',
        }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: enabled ? 'var(--accent)' : 'var(--subtle)',
          border: 'none',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: enabled ? '#000' : 'var(--muted)',
          position: 'absolute',
          top: 3,
          left: enabled ? 23 : 3,
          transition: 'all 0.2s',
        }} />
      </button>
    </div>
  );
}

function InputField({ 
  label, 
  value, 
  onChange, 
  placeholder,
  help,
}: { 
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
        {label}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: 13,
          outline: 'none',
        }}
      />
      {help && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          {help}
        </div>
      )}
    </div>
  );
}

export default function SettingsScreen({ user, onLogout }: Props) {
  const [settings, setSettings] = useState<Settings>({
    pushNotifications: true,
    emailNotifications: true,
    darkMode: true,
  });

  const [stravaCredentials, setStravaCredentials] = useState({
    clientId: '',
    clientSecret: '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveStrava = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/strava', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_credentials',
          clientId: stravaCredentials.clientId,
          clientSecret: stravaCredentials.clientSecret,
        }),
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save credentials:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: 700 }}>
      <div style={s(0)}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--text)',
          margin: 0,
        }}>
          Settings
        </h1>
      </div>

      <div style={s(1)}>
        <Card style={{ marginTop: 24 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Account
            </h2>
          </div>
          
          <div style={{ padding: '4px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000',
                fontSize: 18,
                fontWeight: 600,
              }}>
                {user?.name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiMail size={12} />
                  {user?.email || 'No email'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={s(2)}>
        <Card style={{ marginTop: 24 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Notifications
            </h2>
          </div>
          
          <div style={{ padding: '4px 24px' }}>
            <SettingToggle 
              icon={FiBell}
              label="Push Notifications"
              description="Receive workout and recovery alerts"
              enabled={settings.pushNotifications}
              onChange={(v) => setSettings({...settings, pushNotifications: v})}
            />
            <SettingToggle 
              icon={FiMail}
              label="Email Notifications"
              description="Weekly summary and insights"
              enabled={settings.emailNotifications}
              onChange={(v) => setSettings({...settings, emailNotifications: v})}
            />
          </div>
        </Card>
      </div>

      <div style={s(3)}>
        <Card style={{ marginTop: 24 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              OAuth Credentials
            </h2>
          </div>
          
          <div style={{ padding: 24 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 8, 
              marginBottom: 20,
              padding: '16px',
              background: 'rgba(252,76,2,0.08)',
              borderRadius: 10,
              border: '1px solid rgba(252,76,2,0.25)',
            }}>
              <FiAlertCircle size={18} color="#FC4C02" style={{ marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FC4C02', marginBottom: 8 }}>
                  Follow these steps exactly:
                </div>
                <ol style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text)', lineHeight: 2 }}>
                  <li>Click <strong>"Get your Strava API keys"</strong> below</li>
                  <li>In Strava, create a new Application</li>
                  <li>For <strong>"Authorization Callback Domain"</strong> enter: <code style={{ background: 'var(--subtle)', padding: '2px 6px', borderRadius: 4 }}>localhost</code></li>
                  <li>After creating, copy your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
                  <li>Paste them below and click Save</li>
                  <li>Then go to Devices page to connect</li>
                </ol>
              </div>
            </div>

            <a 
              href="https://www.strava.com/settings/api" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                color: 'var(--accent)',
                textDecoration: 'none',
                marginBottom: 20,
                padding: '12px 20px',
                borderRadius: 8,
                border: '1px solid var(--accent)',
              }}
            >
              <FiExternalLink size={14} />
              Create Strava Application
            </a>

            <InputField
              label="Strava Client ID"
              value={stravaCredentials.clientId}
              onChange={(v) => setStravaCredentials({...stravaCredentials, clientId: v})}
              placeholder="e.g., 12345abcde..."
            />

            <InputField
              label="Strava Client Secret"
              value={stravaCredentials.clientSecret}
              onChange={(v) => setStravaCredentials({...stravaCredentials, clientSecret: v})}
              placeholder="e.g., abc123xyz..."
            />

            <button
              onClick={handleSaveStrava}
              disabled={saving || !stravaCredentials.clientId || !stravaCredentials.clientSecret}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                background: saved 
                  ? 'var(--accent)' 
                  : (!stravaCredentials.clientId || !stravaCredentials.clientSecret)
                    ? 'var(--subtle)'
                    : 'var(--accent)',
                color: saved ? '#000' : (!stravaCredentials.clientId || !stravaCredentials.clientSecret) ? 'var(--muted)' : '#000',
                fontSize: 13,
                fontWeight: 600,
                cursor: (stravaCredentials.clientId && stravaCredentials.clientSecret) ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? (
                <>Saving...</>
              ) : saved ? (
                <>
                  <FiCheck size={14} />
                  Saved!
                </>
              ) : (
                <>
                  <FiKey size={14} />
                  Save Strava Credentials
                </>
              )}
            </button>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                <strong>Other providers:</strong> Garmin, Polar, Whoop require business partnerships.
                <br />
                Suunto requires applying to their developer program.
                <br />
                Samsung & Google Health Connect require the mobile app.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={s(4)}>
        <Card style={{ marginTop: 24 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Appearance
            </h2>
          </div>
          
          <div style={{ padding: '4px 24px' }}>
            <SettingToggle 
              icon={FiMoon}
              label="Dark Mode"
              description="Use dark theme"
              enabled={settings.darkMode}
              onChange={(v) => setSettings({...settings, darkMode: v})}
            />
          </div>
        </Card>
      </div>

      <div style={s(5)}>
        <Card style={{ marginTop: 24 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Danger Zone
            </h2>
          </div>
          
          <div style={{ padding: 24 }}>
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                border: '1px solid #f00',
                background: 'transparent',
                color: '#f00',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FiLogOut size={14} />
              Sign Out
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
