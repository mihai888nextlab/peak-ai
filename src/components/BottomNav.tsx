import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../theme';

export type Screen = 'brief' | 'train' | 'coach' | 'fuel' | 'recover';

interface Props {
  active: Screen;
  onPress: (screen: Screen) => void;
}

const NAV_ITEMS: { screen: Screen; icon: string; label: string }[] = [
  { screen: 'brief',   icon: '☀️',  label: 'Brief'   },
  { screen: 'train',   icon: '💪',  label: 'Train'   },
  { screen: 'coach',   icon: '🎙️', label: 'PEAK'    },  // center
  { screen: 'fuel',    icon: '🥗',  label: 'Fuel'    },
  { screen: 'recover', icon: '⚡',  label: 'Recover' },
];

export default function BottomNav({ active, onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.nav,
      { paddingBottom: insets.bottom + 8 },
    ]}>
      {NAV_ITEMS.map(item => {
        const isCenter  = item.screen === 'coach';
        const isActive  = active === item.screen;

        if (isCenter) {
          return (
            <TouchableOpacity
              key={item.screen}
              style={styles.centerWrap}
              onPress={() => onPress(item.screen)}
              activeOpacity={0.85}
            >
              <View style={styles.centerBtn}>
                <Text style={styles.centerIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.centerLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.screen}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onPress(item.screen)}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(8,8,9,0.92)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    paddingHorizontal: 8,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(200,255,0,0.08)',
  },
  navIcon: { fontSize: 20 },
  navLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  navLabelActive: { color: Colors.accent },

  // Center PEAK button
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
    gap: 4,
  },
  centerBtn: {
    width: 56, height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  centerIcon: { fontSize: 24 },
  centerLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.accent,
  },
});
