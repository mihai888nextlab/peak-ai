import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { Colors, Fonts, Spacing } from '../theme';

// ─── PULSING DOT ────────────────────────────────────────────────
export function PulseDot({ color = Colors.accent, size = 6 }: { color?: string; size?: number }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 0.8, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1,   duration: 1000, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 1000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      width: size, height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity, transform: [{ scale }],
    }} />
  );
}

// ─── READINESS RING ─────────────────────────────────────────────
interface RingProps {
  value: number;      // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  color?: string;
}

export function ReadinessRing({
  value, size = 110, strokeWidth = 8,
  label, subLabel, color = Colors.accent,
}: RingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const animVal = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: offset,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={Colors.subtle}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animVal}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.ringInner}>
          {label    && <Text style={[styles.ringNumber, { color }]}>{label}</Text>}
          {subLabel && <Text style={styles.ringSubLabel}>{subLabel}</Text>}
        </View>
      </View>
    </View>
  );
}

// ─── STAT BAR ────────────────────────────────────────────────────
export function StatBar({
  label, value, displayVal, color = Colors.accent,
}: { label: string; value: number; displayVal: string; color?: string }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: value,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.statBarRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarWrap}>
        <View style={styles.statBarTrack}>
          <Animated.View style={[
            styles.statBarFill,
            { backgroundColor: color, width: width.interpolate({ inputRange: [0,100], outputRange: ['0%','100%'] }) },
          ]} />
        </View>
        <Text style={styles.statVal}>{displayVal}</Text>
      </View>
    </View>
  );
}

// ─── COACH CARD ──────────────────────────────────────────────────
export function CoachCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.coachCard}>
      <Text style={styles.coachEyebrow}>── Coach PEAK</Text>
      <Text style={styles.coachText}>{children}</Text>
    </View>
  );
}

// ─── AI NUDGE ────────────────────────────────────────────────────
export function AiNudge({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.aiNudge}>
      <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>P</Text></View>
      <Text style={styles.aiNudgeText}>{children}</Text>
    </View>
  );
}

// ─── MACRO BAR ───────────────────────────────────────────────────
export function MacroBar({
  name, current, goal, color, dotColor,
}: { name: string; current: number; goal: number; color: string; dotColor: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: pct, duration: 1200, useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.macroBarRow}>
      <View style={styles.macroBarTop}>
        <View style={styles.macroNameRow}>
          <View style={[styles.macroDot, { backgroundColor: dotColor }]} />
          <Text style={styles.macroName}>{name}</Text>
        </View>
        <Text style={styles.macroNums}>{current} / {goal}g</Text>
      </View>
      <View style={styles.macroTrack}>
        <Animated.View style={[
          styles.macroFill,
          { backgroundColor: color, width: width.interpolate({ inputRange:[0,100], outputRange:['0%','100%'] }) },
        ]} />
      </View>
    </View>
  );
}

// ─── RECOVERY BAR ────────────────────────────────────────────────
export function RecoveryBar({
  icon, label, value, color,
}: { icon: string; label: string; value: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: value, duration: 1400, useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.recBar}>
      <View style={styles.recBarTop}>
        <Text style={styles.recBarLabel}>{icon} {label}</Text>
        <Text style={styles.recBarVal}>{value}</Text>
      </View>
      <View style={styles.recTrack}>
        <Animated.View style={[
          styles.recFill,
          { backgroundColor: color, width: width.interpolate({ inputRange:[0,100], outputRange:['0%','100%'] }) },
        ]} />
      </View>
    </View>
  );
}

// ─── SECTION LABEL ───────────────────────────────────────────────
export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

// ─── METRIC CARD ─────────────────────────────────────────────────
export function MetricCard({
  icon, value, label, color, onPress,
}: { icon: string; value: string; label: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.metricCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── WAVEFORM ────────────────────────────────────────────────────
export function Waveform() {
  const bars = [0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1];
  const anims = bars.map(() => useRef(new Animated.Value(4)).current);

  useEffect(() => {
    bars.forEach((delay, i) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(anims[i], { toValue: 16, duration: 600, delay: delay * 1000, useNativeDriver: false }),
          Animated.timing(anims[i], { toValue: 4,  duration: 600, useNativeDriver: false }),
        ])
      );
      anim.start();
    });
  }, []);

  return (
    <View style={styles.waveform}>
      {anims.map((anim, i) => (
        <Animated.View key={i} style={[styles.waveBar, { height: anim }]} />
      ))}
    </View>
  );
}

// ─── SET DOTS ────────────────────────────────────────────────────
export function SetDots({ total, done, active }: { total: number; done: number; active: number }) {
  return (
    <View style={styles.setDots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.setDot,
            i < done      && styles.setDotDone,
            i === active  && styles.setDotActive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Ring
  ringInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  ringNumber: {
    fontFamily: Fonts.display, fontSize: 32, lineHeight: 32,
  },
  ringSubLabel: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  // Stat bar
  statBarRow: { gap: Spacing.xs },
  statLabel: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  statBarWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statBarTrack: {
    flex: 1, height: 3, backgroundColor: Colors.subtle, borderRadius: 2, overflow: 'hidden',
  },
  statBarFill: { height: '100%', borderRadius: 2 },
  statVal: {
    fontFamily: Fonts.mono, fontSize: 11, color: Colors.text,
    minWidth: 44, textAlign: 'right',
  },

  // Coach card
  coachCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  coachEyebrow: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.accent,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: Spacing.sm,
  },
  coachText: {
    fontFamily: Fonts.sansLight, fontSize: 15, color: Colors.text, lineHeight: 22,
  },

  // AI nudge
  aiNudge: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(200,255,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(200,255,0,0.15)',
    borderRadius: 14,
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 32, height: 32,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  aiAvatarText: {
    fontFamily: Fonts.display, fontSize: 16, color: '#000',
  },
  aiNudgeText: {
    fontFamily: Fonts.sansLight, fontSize: 13, color: Colors.text,
    lineHeight: 20, flex: 1,
  },

  // Macro bar
  macroBarRow: { gap: Spacing.sm },
  macroBarTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  macroNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  macroDot: { width: 6, height: 6, borderRadius: 3 },
  macroName: { fontFamily: Fonts.sansMed, fontSize: 12, color: Colors.text },
  macroNums: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted },
  macroTrack: {
    height: 6, backgroundColor: Colors.subtle, borderRadius: 3, overflow: 'hidden',
  },
  macroFill: { height: '100%', borderRadius: 3 },

  // Recovery bar
  recBar: { gap: Spacing.sm },
  recBarTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  recBarLabel: { fontFamily: Fonts.sansMed, fontSize: 13, color: Colors.text },
  recBarVal: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text },
  recTrack: { height: 8, backgroundColor: Colors.subtle, borderRadius: 4, overflow: 'hidden' },
  recFill: { height: '100%', borderRadius: 4 },

  // Section label
  sectionLabel: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: Spacing.md,
  },

  // Metric card
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  metricIcon: { fontSize: 18, marginBottom: 6 },
  metricValue: { fontFamily: Fonts.display, fontSize: 22, lineHeight: 22, marginBottom: 2 },
  metricLabel: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  // Waveform
  waveform: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    height: 20, marginTop: 6,
  },
  waveBar: {
    width: 3, borderRadius: 2, backgroundColor: 'rgba(200,255,0,0.4)',
  },

  // Set dots
  setDots: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  setDot: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: Colors.subtle,
  },
  setDotDone: { backgroundColor: Colors.accent },
  setDotActive: { backgroundColor: Colors.accent, opacity: 0.5 },
});
