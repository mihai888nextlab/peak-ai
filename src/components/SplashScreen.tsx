import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Fonts } from '../theme';

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const logoScale   = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const lineHeight  = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      // Logo in
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(logoScale,   { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // Tagline in
      Animated.timing(tagOpacity, { toValue: 1, duration: 500, useNativeDriver: false }),
      // Line grows
      Animated.timing(lineHeight, { toValue: 60, duration: 700, useNativeDriver: false }),
      Animated.delay(400),
      // Fade out
      Animated.timing(exitOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <Animated.Text style={[
        styles.logo,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
      ]}>
        PEAK
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        ATHLETIC INTELLIGENCE
      </Animated.Text>

      <Animated.View style={[styles.line, { height: lineHeight }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    fontFamily: Fonts.display,
    fontSize: 88,
    color: Colors.accent,
    letterSpacing: 4,
    lineHeight: 88,
  },
  tagline: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  line: {
    width: 1,
    marginTop: 32,
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },
});
