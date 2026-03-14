'use client';

import { signOut } from 'next-auth/react';
import { Screen } from '@/lib/data';
import { FiSun, FiActivity, FiCoffee, FiZap, FiUser, FiTrendingUp, FiTarget, FiSettings, FiClock, FiArrowRight, FiLogOut, FiSmartphone, FiAlertCircle } from 'react-icons/fi';
import { TerrainIcon } from './ui';

const MAIN_NAV = [
  { id: 'brief'   as Screen, icon: FiSun,       label: 'Dashboard' },
  { id: 'train'   as Screen, icon: FiActivity,  label: 'Train'        },
  { id: 'fuel'    as Screen, icon: FiCoffee,    label: 'Fuel'         },
  { id: 'recover' as Screen, icon: FiZap,       label: 'Recover'      },
  { id: 'coach'   as Screen, icon: TerrainIcon, label: 'Coach PEAK'   },
];

const SECONDARY_NAV = [
  { id: 'injuries' as Screen, icon: FiAlertCircle,   label: 'Injuries'    },
  { id: 'devices'  as Screen, icon: FiSmartphone,    label: 'Devices'     },
  { id: 'profile'  as Screen, icon: FiUser,          label: 'Profile'     },
  { id: 'analytics' as Screen, icon: FiTrendingUp,   label: 'Analytics'   },
  { id: 'history'  as Screen, icon: FiClock,         label: 'History'     },
  { id: 'goals'    as Screen, icon: FiTarget,        label: 'Goals'       },
];

interface UserData {
  name: string;
  email: string;
  initials: string;
  image?: string | null;
}

interface Props {
  active: Screen;
  onNavigate: (s: Screen) => void;
  user: UserData;
}

function NavItem({ item, isActive, onNavigate }: { item: typeof MAIN_NAV[0]; isActive: boolean; onNavigate: (s: Screen) => void }) {
  return (
    <button
      onClick={() => onNavigate(item.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 20px',
        cursor: 'pointer',
        border: 'none',
        borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
        background: isActive ? 'rgba(200,255,0,0.06)' : 'transparent',
        color: isActive ? 'var(--accent)' : '#888',
        fontSize: 13, fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        margin: '1px 0',
        transition: 'all 0.15s',
        textAlign: 'left',
        width: '100%',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderLeftColor = 'var(--muted)'; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}}
    >
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}><item.icon /></span>
      <span>{item.label}</span>
    </button>
  );
}

function SecondaryNavItem({ item, isActive, onNavigate }: { item: typeof SECONDARY_NAV[0]; isActive: boolean; onNavigate: (s: Screen) => void }) {
  return (
    <button
      onClick={() => onNavigate(item.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 20px',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        color: isActive ? 'var(--accent)' : '#666',
        fontSize: 12, fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.15s',
        textAlign: 'left',
        width: '100%',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; }}}
    >
      <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}><item.icon /></span>
      <span>{item.label}</span>
      <FiArrowRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
    </button>
  );
}

export default function Sidebar({ active, onNavigate, user }: Props) {
  return (
    <nav style={{
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 0',
      overflow: 'hidden',
      height: '100%',
    }}>
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <button
          onClick={() => onNavigate('coach')}
          style={{
            width: '100%',
            background: 'var(--accent)',
            border: 'none', borderRadius: 10,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,255,0,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <span style={{ fontSize: 20 }}><TerrainIcon size={20} color="#000" /></span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#000', letterSpacing: '0.05em' }}>
            ASK COACH PEAK
          </span>
        </button>
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        padding: '0 20px', marginBottom: 6,
      }}>Daily</div>

      {MAIN_NAV.map(item => (
        <NavItem key={item.id} item={item} isActive={active === item.id} onNavigate={onNavigate} />
      ))}

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        padding: '0 20px', marginBottom: 6,
      }}>Progress</div>

      {SECONDARY_NAV.map(item => (
        <SecondaryNavItem key={item.id} item={item} isActive={active === item.id} onNavigate={onNavigate} />
      ))}

      <div style={{ flex: 1 }} />

      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 8,
      }}>
        {user.image ? (
          <img 
            src={user.image} 
            alt={user.name}
            style={{
              width: 34, height: 34, borderRadius: 9,
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 18, color: '#000',
          }}>{user.initials}</div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>PEAK PRO</div>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: active === 'settings' ? 'rgba(200,255,0,0.1)' : 'transparent',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: active === 'settings' ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.2s',
          }}
        >
          <FiSettings size={16} />
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          title="Sign out"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'transparent',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--muted)',
            transition: 'all 0.2s',
          }}
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
