import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../theme';
import { PulseDot, Waveform } from '../components';

interface Message {
  id: string;
  from: 'peak' | 'user';
  text: string;
  time: string;
  showWave?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1', from: 'peak',
    text: 'Your squat depth improved 12% this week. Your left knee still caves slightly on rep 4+. Here\'s what to fix.',
    time: '09:32 AM', showWave: true,
  },
  {
    id: '2', from: 'user',
    text: 'What should I eat before tonight\'s session?',
    time: '09:35 AM',
  },
  {
    id: '3', from: 'peak',
    text: 'Your session is at 6PM. Eat a medium-carb meal at 4PM — rice, chicken, some greens. Keep fat low. Then 30min before: banana + espresso. You\'ll be dialled in.',
    time: '09:35 AM',
  },
  {
    id: '4', from: 'user',
    text: 'How hard should I go today?',
    time: '09:41 AM',
  },
];

export default function CoachScreen() {
  const [messages, setMessages]   = useState<Message[]>(INITIAL_MESSAGES);
  const [typing, setTyping]       = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(16)).current;
  const micScale   = useRef(new Animated.Value(1)).current;
  const micGlow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Trigger typing → response animation on mount
    setTimeout(() => {
      setTyping(true);
      scrollToBottom();
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, {
          id: '5', from: 'peak',
          text: 'HRV is at 62ms — solid. Legs are loaded but upper body is fresh. Push hard on pressing movements, stay technical on everything else. Cap your total volume at 70% today.',
          time: '09:41 AM',
        }]);
        scrollToBottom();
      }, 1800);
    }, 600);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleMicPress = () => {
    if (listening) return;
    setListening(true);

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(micScale, { toValue: 1.08, duration: 700, useNativeDriver: true }),
          Animated.timing(micGlow,  { toValue: 1,    duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(micScale, { toValue: 1,    duration: 700, useNativeDriver: true }),
          Animated.timing(micGlow,  { toValue: 0,    duration: 700, useNativeDriver: true }),
        ]),
      ])
    ).start();

    setTimeout(() => {
      setListening(false);
      micScale.stopAnimation();
      micGlow.stopAnimation();
      Animated.timing(micScale, { toValue: 1, duration: 200, useNativeDriver: true }).start();

      const userMsg: Message = {
        id: Date.now().toString(), from: 'user',
        text: 'How are my recovery numbers today?',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, userMsg]);
      scrollToBottom();

      setTimeout(() => {
        setTyping(true);
        scrollToBottom();
        setTimeout(() => {
          setTyping(false);
          const peakMsg: Message = {
            id: (Date.now() + 1).toString(), from: 'peak',
            text: 'Recovery is at 74 — solid. HRV is trending up this week. Sleep quality was 82% last night. You\'re in good shape to push tomorrow.',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, peakMsg]);
          scrollToBottom();
        }, 1500);
      }, 400);
    }, 2500);
  };

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Coach Header */}
      <View style={styles.coachTop}>
        <View style={styles.coachAvatar}>
          <Text style={styles.coachAvatarText}>P</Text>
        </View>
        <View style={styles.coachInfo}>
          <Text style={styles.coachName}>Coach PEAK</Text>
          <View style={styles.coachOnline}>
            <PulseDot size={6} />
            <Text style={styles.coachOnlineText}> Online · Always here</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.xl, gap: 16 }}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.msgWrap, msg.from === 'user' && styles.msgWrapUser]}>
            <View style={[styles.bubble, msg.from === 'user' ? styles.bubbleUser : styles.bubblePeak]}>
              <Text style={[styles.bubbleText, msg.from === 'user' && styles.bubbleTextUser]}>
                {msg.text}
              </Text>
            </View>
            {msg.showWave && msg.from === 'peak' && <Waveform />}
            <Text style={[styles.msgTime, msg.from === 'user' && styles.msgTimeUser]}>
              {msg.time}
            </Text>
          </View>
        ))}

        {typing && (
          <View style={styles.msgWrap}>
            <View style={[styles.bubble, styles.bubblePeak]}>
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Voice Input */}
      <View style={styles.voiceArea}>
        <Animated.View style={[
          styles.micGlowRing,
          {
            opacity: micGlow,
            transform: [{ scale: micScale }],
          },
        ]} />
        <TouchableOpacity
          style={[styles.voiceBtn, listening && styles.voiceBtnListening]}
          onPress={handleMicPress}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.micIcon, { transform: [{ scale: micScale }] }]}>
            <Text style={styles.micEmoji}>{listening ? '🔴' : '🎙️'}</Text>
          </Animated.View>
          <Text style={[styles.voiceLabel, listening && styles.voiceLabelListening]}>
            {listening ? 'Listening...' : 'Hold to speak to Coach'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Typing indicator dots
function TypingDots() {
  const dots = [0, 0.2, 0.4].map(() => useRef(new Animated.Value(0.3)).current);

  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', padding: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={{
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: Colors.muted, opacity: dot,
        }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.bg,
    flexDirection: 'column',
  },

  coachTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coachAvatar: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  coachAvatarText: { fontFamily: Fonts.display, fontSize: 22, color: '#000' },
  coachInfo: { flex: 1 },
  coachName: { fontFamily: Fonts.sansSemi, fontSize: 16, color: Colors.text },
  coachOnline: {
    flexDirection: 'row', alignItems: 'center', marginTop: 3,
  },
  coachOnlineText: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.accent,
    letterSpacing: 0.5,
  },

  messages: { flex: 1 },

  msgWrap: { alignItems: 'flex-start', gap: 4 },
  msgWrapUser: { alignItems: 'flex-end' },

  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
  },
  bubblePeak: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontFamily: Fonts.sansLight, fontSize: 14,
    color: Colors.text, lineHeight: 21,
  },
  bubbleTextUser: {
    fontFamily: Fonts.sansMed, color: '#000',
  },
  msgTime: {
    fontFamily: Fonts.mono, fontSize: 9,
    color: Colors.muted, letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  msgTimeUser: { textAlign: 'right' },

  voiceArea: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    position: 'relative',
  },
  micGlowRing: {
    position: 'absolute',
    top: 10, left: 20, right: 20, bottom: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(200,255,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(200,255,0,0.2)',
  },
  voiceBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  voiceBtnListening: {
    backgroundColor: 'rgba(200,255,0,0.08)',
    borderColor: Colors.accent,
  },
  micIcon: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  micEmoji: { fontSize: 16 },
  voiceLabel: {
    fontFamily: Fonts.sans, fontSize: 14, color: Colors.muted,
  },
  voiceLabelListening: { color: Colors.accent },
});
