# PEAK — Athletic Intelligence OS
## React Native (Expo) — Full Setup Guide

---

## 📁 Project Structure

```
peak-rn/
├── App.tsx                          ← Root entry, navigation, splash
├── app.json                         ← Expo config
├── package.json                     ← Dependencies
├── assets/
│   └── fonts/                       ← Font files go here (see below)
└── src/
    ├── theme/
    │   └── index.ts                 ← Colors, fonts, spacing constants
    ├── components/
    │   ├── index.tsx                ← Shared components (rings, bars, cards)
    │   ├── BottomNav.tsx            ← Bottom navigation
    │   └── SplashScreen.tsx         ← Animated splash
    └── screens/
        ├── BriefScreen.tsx          ← ☀️  Morning brief
        ├── TrainScreen.tsx          ← 💪  Training + skeleton overlay
        ├── FuelScreen.tsx           ← 🥗  Nutrition
        ├── RecoverScreen.tsx        ← ⚡  Recovery
        └── CoachScreen.tsx          ← 🎙️  AI Coach chat + voice
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd peak-rn
npm install
```

### 2. Download fonts
Create `assets/fonts/` and download these free fonts:

| Font | File Name | Download |
|------|-----------|----------|
| Bebas Neue Regular | `BebasNeue-Regular.ttf` | [Google Fonts](https://fonts.google.com/specimen/Bebas+Neue) |
| JetBrains Mono Regular | `JetBrainsMono-Regular.ttf` | [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono) |
| JetBrains Mono Medium | `JetBrainsMono-Medium.ttf` | [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono) |
| DM Sans Light | `DMSans-Light.ttf` | [Google Fonts](https://fonts.google.com/specimen/DM+Sans) |
| DM Sans Regular | `DMSans-Regular.ttf` | [Google Fonts](https://fonts.google.com/specimen/DM+Sans) |
| DM Sans Medium | `DMSans-Medium.ttf` | [Google Fonts](https://fonts.google.com/specimen/DM+Sans) |
| DM Sans SemiBold | `DMSans-SemiBold.ttf` | [Google Fonts](https://fonts.google.com/specimen/DM+Sans) |

### 3. Run the app
```bash
# Start Expo dev server
npx expo start

# Scan QR code with Expo Go app on your Android device
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | Cross-platform runtime |
| `expo-font` | Custom font loading |
| `expo-splash-screen` | Splash screen control |
| `react-native-svg` | Skeleton SVG rendering |
| `react-native-safe-area-context` | Safe area insets |

---

## 🎨 Design System

### Colors
```ts
bg:      '#080809'   // Near-black background
card:    '#141416'   // Card surfaces
accent:  '#C8FF00'   // Electric lime — signature PEAK color
orange:  '#FF6B35'   // Nutrition / warnings
blue:    '#3D9EFF'   // Sleep / data
text:    '#F0F0F5'   // Primary text
muted:   '#55555F'   // Secondary text
```

### Typography
- **Bebas Neue** — Big impact numbers, screen titles
- **JetBrains Mono** — Data values, labels, timestamps  
- **DM Sans** — Body text, descriptions

---

## 📱 Screens

| Screen | File | Key Features |
|--------|------|-------------|
| ☀️ Brief | `BriefScreen.tsx` | Readiness ring, stat bars, coach card, CTAs |
| 💪 Train | `TrainScreen.tsx` | Camera frame, SVG skeleton ghost overlay, rep counter |
| 🥗 Fuel | `FuelScreen.tsx` | Animated macro bars, meal log, snap button |
| ⚡ Recover | `RecoverScreen.tsx` | Big recovery ring, 4 recovery bars |
| 🎙️ Coach | `CoachScreen.tsx` | Chat UI, typing animation, voice button |

---

## 🔧 Next Steps (Post-Hackathon)

1. **Camera integration** — Replace skeleton placeholder with real `expo-camera` + MediaPipe
2. **Voice** — Wire `Deepgram` STT and `ElevenLabs` TTS to CoachScreen
3. **Claude API** — Connect `CoachScreen` messages to real Claude API calls
4. **Supabase** — Replace mock data with real database queries
5. **Google Health Connect** — Wire wearable data to `BriefScreen` and `RecoverScreen`
