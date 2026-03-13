import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../theme';
import { ReadinessRing, RecoveryBar, AiNudge } from '../components';

export default function RecoverScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
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
          <Text style={styles.title}>RECOVER</Text>
          <Text style={styles.subtitle}>Today's body report</Text>
        </View>

        {/* Big Score Ring */}
        <View style={styles.scoreDisplay}>
          <ReadinessRing
            value={74}
            size={160}
            strokeWidth={10}
            label="74"
            subLabel="GOOD"
          />
          <Text style={styles.scoreLabel}>Recovery Score</Text>
        </View>

        {/* Recovery Bars */}
        <View style={styles.bars}>
          <RecoveryBar icon="😴" label="Sleep Quality" value={82} color={Colors.blue}   />
          <RecoveryBar icon="💓" label="HRV Score"     value={78} color={Colors.accent} />
          <RecoveryBar icon="🔥" label="Muscle Fatigue" value={45} color={Colors.orange} />
          <RecoveryBar icon="🧠" label="Mental Load"   value={60} color={Colors.blue}   />
        </View>

        {/* AI Nudge */}
        <AiNudge>
          You're good to train hard tomorrow. Sleep before midnight tonight — your HRV responds well to consistent sleep timing.
        </AiNudge>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
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
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4,
  },

  scoreDisplay: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  scoreLabel: {
    fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 12,
  },

  bars: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: 16,
  },
});
