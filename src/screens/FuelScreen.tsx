import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../theme';
import { MacroBar, AiNudge, SectionLabel } from '../components';

const MEALS = [
  { emoji: '🍳', name: 'Breakfast',         time: '07:30 AM', kcal: 520 },
  { emoji: '🥗', name: 'Lunch',             time: '12:15 PM', kcal: 680 },
  { emoji: '🍌', name: 'Pre-workout snack', time: '04:00 PM', kcal: 210 },
  { emoji: '🍗', name: 'Dinner',            time: '07:45 PM', kcal: 690 },
];

export default function FuelScreen() {
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
          <Text style={styles.title}>FUEL</Text>
          <Text style={styles.subtitle}>Monday · 2,100 / 2,800 kcal</Text>
        </View>

        {/* Snap Button */}
        <TouchableOpacity style={styles.snapBtn} activeOpacity={0.7}>
          <View style={styles.snapIcon}>
            <Text style={styles.snapIconText}>📸</Text>
          </View>
          <View>
            <Text style={styles.snapLabel}>Log a meal</Text>
            <Text style={styles.snapHint}>Snap a photo for instant macros</Text>
          </View>
        </TouchableOpacity>

        {/* Macros */}
        <View style={styles.macroSection}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroKcal}>
              2,100 <Text style={styles.macroGoalInline}>/ 2,800 kcal</Text>
            </Text>
            <Text style={styles.macroGoalPct}>75% goal</Text>
          </View>

          <View style={styles.macroBars}>
            <MacroBar name="Protein" current={145} goal={180} color={Colors.accent} dotColor={Colors.accent} />
            <MacroBar name="Carbs"   current={220} goal={300} color={Colors.blue}   dotColor={Colors.blue}   />
            <MacroBar name="Fat"     current={55}  goal={80}  color={Colors.orange} dotColor={Colors.orange} />
          </View>
        </View>

        {/* AI Nudge */}
        <AiNudge>
          You need 35g protein in the next 2 hours before your 6PM session. Greek yogurt + handful of almonds would do it.
        </AiNudge>

        {/* Meals Logged */}
        <View style={styles.mealsSection}>
          <SectionLabel>Logged Today</SectionLabel>
          {MEALS.map((meal, i) => (
            <View key={i} style={styles.mealRow}>
              <View style={styles.mealLeft}>
                <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                <View>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
              </View>
              <Text style={styles.mealKcal}>{meal.kcal} kcal</Text>
            </View>
          ))}
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

  snapBtn: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  snapIcon: {
    width: 44, height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(200,255,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  snapIconText: { fontSize: 20 },
  snapLabel: { fontFamily: Fonts.sansMed, fontSize: 14, color: Colors.text, marginBottom: 2 },
  snapHint:  { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted },

  macroSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  macroKcal: { fontFamily: Fonts.display, fontSize: 36, color: Colors.text },
  macroGoalInline: { fontSize: 20, color: Colors.muted },
  macroGoalPct: {
    fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted,
    letterSpacing: 0.5,
  },
  macroBars: { gap: 14 },

  mealsSection: {
    paddingHorizontal: Spacing.xl,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mealLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealEmoji: { fontSize: 20 },
  mealName: { fontFamily: Fonts.sansMed, fontSize: 14, color: Colors.text },
  mealTime: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, marginTop: 2,
  },
  mealKcal: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.muted },
});
