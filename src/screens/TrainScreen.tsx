import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, {
  Circle, Line, G, Defs, Filter,
  FeGaussianBlur, FeMerge, FeMergeNode,
} from 'react-native-svg';
import { Colors, Fonts, Spacing } from '../theme';
import { SetDots, AiNudge } from '../components';

const { width } = Dimensions.get('window');
const CAMERA_HEIGHT = (width - 48) * (4 / 3);

export default function TrainScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  // Pulsing cue animation
  const cuePulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(cuePulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(cuePulse, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>UPPER{'\n'}BODY</Text>
            <Text style={styles.subtitle}>Session · 5 exercises</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SET 3 / 5</Text>
          </View>
        </View>

        {/* Set dots */}
        <SetDots total={5} done={2} active={2} />

        {/* Camera Frame */}
        <View style={styles.cameraFrame}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Skeleton Legend */}
          <View style={styles.skeletonLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent, opacity: 0.4 }]} />
              <Text style={styles.legendText}>IDEAL FORM</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#fff' }]} />
              <Text style={styles.legendText}>YOUR FORM</Text>
            </View>
          </View>

          {/* Skeleton SVG */}
          <View style={styles.skeletonWrap}>
            <Svg width={140} height={220} viewBox="0 0 140 220">
              {/* IDEAL skeleton – lime, low opacity */}
              <G stroke={Colors.accent} strokeWidth={2} opacity={0.28}>
                {/* head */}
                <Circle cx={70} cy={20} r={12} fill="none" strokeWidth={1.5} />
                {/* spine */}
                <Line x1={70} y1={32} x2={70} y2={100} />
                {/* shoulders */}
                <Line x1={30} y1={50} x2={110} y2={50} />
                {/* left arm */}
                <Line x1={30} y1={50} x2={10}  y2={100} />
                <Line x1={10} y1={100} x2={20} y2={145} />
                {/* right arm */}
                <Line x1={110} y1={50}  x2={130} y2={100} />
                <Line x1={130} y1={100} x2={120} y2={145} />
                {/* hips */}
                <Line x1={45} y1={100} x2={95} y2={100} />
                {/* left leg */}
                <Line x1={45} y1={100} x2={35} y2={165} />
                <Line x1={35} y1={165} x2={38} y2={215} />
                {/* right leg */}
                <Line x1={95}  y1={100} x2={105} y2={165} />
                <Line x1={105} y1={165} x2={102} y2={215} />
                {/* joints */}
                <Circle cx={30}  cy={50}  r={4} fill={Colors.accent} />
                <Circle cx={110} cy={50}  r={4} fill={Colors.accent} />
                <Circle cx={10}  cy={100} r={3} fill={Colors.accent} />
                <Circle cx={130} cy={100} r={3} fill={Colors.accent} />
                <Circle cx={45}  cy={100} r={4} fill={Colors.accent} />
                <Circle cx={95}  cy={100} r={4} fill={Colors.accent} />
                <Circle cx={35}  cy={165} r={3} fill={Colors.accent} />
                <Circle cx={105} cy={165} r={3} fill={Colors.accent} />
              </G>

              {/* USER skeleton – white, slightly off */}
              <G stroke="white" strokeWidth={2} opacity={0.9}>
                <Circle cx={72} cy={20}  r={12} fill="none" strokeWidth={1.5} />
                <Line x1={72}  y1={32}   x2={72}  y2={100} />
                <Line x1={32}  y1={52}   x2={112} y2={52}  />
                <Line x1={32}  y1={52}   x2={8}   y2={105} />
                <Line x1={8}   y1={105}  x2={16}  y2={148} />
                {/* right arm flaring */}
                <Line x1={112} y1={52}  x2={136} y2={96}  />
                <Line x1={136} y1={96}  x2={128} y2={140} />
                <Line x1={47}  y1={102} x2={97}  y2={102} />
                <Line x1={47}  y1={102} x2={36}  y2={167} />
                <Line x1={36}  y1={167} x2={39}  y2={215} />
                <Line x1={97}  y1={102} x2={107} y2={167} />
                <Line x1={107} y1={167} x2={104} y2={215} />
                {/* normal joints */}
                <Circle cx={32} cy={52}  r={4} fill="white" />
                <Circle cx={112} cy={52} r={4} fill="white" />
                <Circle cx={8}  cy={105} r={3} fill="white" />
                <Circle cx={47} cy={102} r={4} fill="white" />
                <Circle cx={97} cy={102} r={4} fill="white" />
                {/* flagged joint – orange */}
                <Circle cx={136} cy={96} r={3} fill={Colors.orange} stroke={Colors.orange} />
              </G>

              {/* Deviation ring on flagged joint */}
              <Circle
                cx={136} cy={96} r={10}
                fill="none" stroke={Colors.orange}
                strokeWidth={1.5} opacity={0.5}
              />
            </Svg>
          </View>

          {/* Cue Banner */}
          <View style={styles.cueBanner}>
            <Animated.View style={[styles.cueWarning, { opacity: cuePulse }]}>
              <View style={styles.cueDot} />
              <Text style={styles.cueText}>Right elbow flaring — tuck it in</Text>
            </Animated.View>

            <View style={styles.repRow}>
              <View style={styles.repDisplay}>
                <Text style={styles.repCurrent}>7</Text>
                <Text style={styles.repTotal}>/10</Text>
              </View>
              <Text style={styles.repLabel}>REPS</Text>
              <View style={styles.restTimer}>
                <Text style={styles.restTimerText}>REST 45s</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Nudge */}
        <AiNudge>
          Bench press looking strong. +12% depth vs last week. Keep your scapulae retracted through the full range.
        </AiNudge>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.display, fontSize: 44,
    lineHeight: 40, color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 6,
  },
  badge: {
    backgroundColor: 'rgba(200,255,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200,255,0,0.2)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.accent, letterSpacing: 0.5,
  },

  // Camera
  cameraFrame: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#0A0A0C',
    height: CAMERA_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Corners
  corner: {
    position: 'absolute',
    width: 20, height: 20,
    zIndex: 3,
  },
  cornerTL: {
    top: 12, left: 12,
    borderTopWidth: 1, borderLeftWidth: 1,
    borderColor: `${Colors.accent}80`,
  },
  cornerTR: {
    top: 12, right: 12,
    borderTopWidth: 1, borderRightWidth: 1,
    borderColor: `${Colors.accent}80`,
  },
  cornerBL: {
    bottom: 12, left: 12,
    borderBottomWidth: 1, borderLeftWidth: 1,
    borderColor: `${Colors.accent}80`,
  },
  cornerBR: {
    bottom: 12, right: 12,
    borderBottomWidth: 1, borderRightWidth: 1,
    borderColor: `${Colors.accent}80`,
  },

  skeletonLegend: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
    gap: 16,
    zIndex: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },

  skeletonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  // Cue banner
  cueBanner: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    paddingTop: 32,
    backgroundColor: 'rgba(8,8,9,0)',
    background: 'linear-gradient(to top, #080809 60%, transparent)',
  },
  cueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  cueDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.orange, flexShrink: 0,
  },
  cueText: { fontFamily: Fonts.sansMed, fontSize: 13, color: Colors.orange },

  repRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repDisplay: { flexDirection: 'row', alignItems: 'flex-end' },
  repCurrent: {
    fontFamily: Fonts.display, fontSize: 48, color: Colors.accent, lineHeight: 48,
  },
  repTotal: {
    fontFamily: Fonts.display, fontSize: 24, color: Colors.muted, lineHeight: 48,
  },
  repLabel: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  restTimer: {
    backgroundColor: Colors.subtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  restTimerText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text },
});
