import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../theme';
import {
  PulseDot, ReadinessRing, StatBar,
  CoachCard, MetricCard,
} from '../components';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function BriefScreen({ onNavigate }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            GOOD{'\n'}MORNING,{'\n'}<Text style={styles.nameAccent}>MARCUS.</Text>
          </Text>
          <Text style={styles.date}>Monday · March 09 · Week 8</Text>
        </View>

        {/* Readiness Ring + Stats */}
        <View style={styles.ringRow}>
          <ReadinessRing
            value={74}
            size={110}
            label="74"
            subLabel="READY"
          />
          <View style={styles.statsCol}>
            <StatBar label="Sleep"    value={69} displayVal="6h 20m" color={Colors.blue}   />
            <StatBar label="HRV"      value={78} displayVal="62ms"   color={Colors.accent} />
            <StatBar label="Leg Load" value={85} displayVal="HIGH"   color={Colors.orange} />
          </View>
        </View>

        {/* Coach Card */}
        <CoachCard>
          Your legs are carrying 3 days of fatigue. Upper body session today. Cap intensity at 70% — focus on technique, not weight.
        </CoachCard>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => onNavigate('train')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>LET'S GO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => onNavigate('coach')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>🎙️  Ask Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="🥗" value="68%" label="Fueled"
            color={Colors.orange} onPress={() => onNavigate('fuel')}
          />
          <MetricCard
            icon="⚡" value="74" label="Recovery"
            color={Colors.accent} onPress={() => onNavigate('recover')}
          />
          <MetricCard
            icon="🔥" value="8" label="Day Streak"
            color={Colors.blue}
          />
        </View>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontFamily: Fonts.display,
    fontSize: 52,
    lineHeight: 50,
    letterSpacing: 1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  nameAccent: { color: Colors.accent },
  date: {
    fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted,
    letterSpacing: 1, textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },

  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  statsCol: { flex: 1, gap: 12 },

  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: Fonts.display, fontSize: 18,
    color: '#000', letterSpacing: 1,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    fontFamily: Fonts.sansMed, fontSize: 14, color: Colors.text,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.xl,
  },
});
