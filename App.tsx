import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreenExpo from 'expo-splash-screen';

import { Colors } from './src/theme';
import SplashScreen from './src/components/SplashScreen';
import BottomNav, { Screen } from './src/components/BottomNav';

import BriefScreen   from './src/screens/BriefScreen';
import TrainScreen   from './src/screens/TrainScreen';
import CoachScreen   from './src/screens/CoachScreen';
import FuelScreen    from './src/screens/FuelScreen';
import RecoverScreen from './src/screens/RecoverScreen';

SplashScreenExpo.preventAutoHideAsync();

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('brief');
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    'BebasNeue-Regular':      require('./assets/fonts/BebasNeue-Regular.ttf'),
    'JetBrainsMono-Regular':  require('./assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrainsMono-Medium':   require('./assets/fonts/JetBrainsMono-Medium.ttf'),
    'DMSans-Light':           require('./assets/fonts/DMSans-Light.ttf'),
    'DMSans-Regular':         require('./assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium':          require('./assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold':        require('./assets/fonts/DMSans-SemiBold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreenExpo.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const renderScreen = () => {
    switch (activeScreen) {
      case 'brief':   return <BriefScreen   onNavigate={(s) => setActiveScreen(s as Screen)} />;
      case 'train':   return <TrainScreen   />;
      case 'coach':   return <CoachScreen   />;
      case 'fuel':    return <FuelScreen    />;
      case 'recover': return <RecoverScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.root} onLayout={onLayoutRootView}>

        {/* Splash */}
        {showSplash && (
          <SplashScreen onDone={() => setShowSplash(false)} />
        )}

        {/* Status bar row */}
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.statusBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.statusDot} />
              <View style={styles.statusText}>
                <StatusBarText>PEAK OS</StatusBarText>
              </View>
            </View>
            <StatusBarText>MON 09 MAR</StatusBarText>
            <StatusBarText>09:41</StatusBarText>
          </View>
        </SafeAreaView>

        {/* Screen content */}
        <View style={styles.screenContainer}>
          {renderScreen()}
        </View>

        {/* Bottom nav */}
        <BottomNav active={activeScreen} onPress={setActiveScreen} />

      </View>
    </SafeAreaProvider>
  );
}

function StatusBarText({ children }: { children: string }) {
  return (
    <View>
      {/* We inline here because Fonts may not be available at module level */}
      <View>
        <StatusBarTextInner>{children}</StatusBarTextInner>
      </View>
    </View>
  );
}

function StatusBarTextInner({ children }: { children: string }) {
  const { Text } = require('react-native');
  return (
    <Text style={{
      fontFamily: 'JetBrainsMono-Regular',
      fontSize: 11,
      color: Colors.muted,
      letterSpacing: 0.5,
    }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safe: {
    backgroundColor: Colors.bg,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  statusDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  statusText: { flexDirection: 'row', alignItems: 'center' },
  screenContainer: { flex: 1 },
});
