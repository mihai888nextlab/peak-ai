'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Screen } from '@/lib/data';
import Splash from './Splash';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import BriefScreen   from './screens/BriefScreen';
import TrainScreen   from './screens/TrainScreen';
import FuelScreen    from './screens/FuelScreen';
import RecoverScreen from './screens/RecoverScreen';
import CoachScreen   from './screens/CoachScreen';
import ProfileScreen from './screens/ProfileScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import HistoryScreen from './screens/HistoryScreen';
import GoalsScreen from './screens/GoalsScreen';
import SettingsScreen from './screens/SettingsScreen';
import DevicesScreen from './screens/DevicesScreen';
import FloatingCoachInput from './FloatingCoachInput';

interface UserGoals {
  dailyCalorieGoal: number;
  goalType: 'maintain' | 'bulk' | 'cut';
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export default function PeakApp() {
  const { data: session, status } = useSession();
  const [ready, setReady]     = useState(false);
  const [screen, setScreen]   = useState<Screen>('brief');
  const [goals, setGoals]     = useState<UserGoals | null>(null);

  const user = session?.user;
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const userImage = user?.image;

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/goals')
        .then(res => res.json())
        .then(data => {
          if (data.dailyCalorieGoal) {
            setGoals(data);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  const updateGoals = (newGoals: UserGoals) => {
    setGoals(newGoals);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'brief':   return <BriefScreen userName={userName} onNavigate={setScreen} />;
      case 'train':   return <TrainScreen />;
      case 'fuel':    return <FuelScreen goals={goals} />;
      case 'recover': return <RecoverScreen />;
      case 'coach':   return <CoachScreen goals={goals} />;
      case 'profile': return <ProfileScreen user={session?.user} onNavigate={setScreen} />;
      case 'analytics': return <AnalyticsScreen onNavigate={setScreen} />;
      case 'history': return <HistoryScreen />;
      case 'goals': return <GoalsScreen goals={goals} onSave={updateGoals} />;
      case 'settings': return <SettingsScreen user={session?.user} onLogout={() => signOut({ callbackUrl: '/' })} />;
      case 'devices': return <DevicesScreen />;
    }
  };

  return (
    <>
      {!ready && <Splash onDone={() => setReady(true)} />}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'var(--sidebar-w) 1fr',
        gridTemplateRows: 'var(--topbar-h) 1fr',
        height: '100vh',
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Topbar userInitials={userInitials} />
        </div>

        <Sidebar 
          active={screen} 
          onNavigate={setScreen}
          user={{
            name: userName,
            email: userEmail,
            initials: userInitials,
            image: userImage,
          }}
        />

        <div style={{ overflow: 'auto', position: 'relative', paddingBottom: 80 }}>
          <div key={screen} style={{ height: '100%', animation: 'fadeUp 0.3s ease' }}>
            {renderScreen()}
          </div>
        </div>
      </div>

      <FloatingCoachInput currentScreen={screen} onNavigate={setScreen} />
    </>
  );
}
