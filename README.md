# PEAK — Athletic Intelligence OS (Next.js)

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          ← Root layout, metadata
│   └── page.tsx            ← Entry point
├── components/
│   ├── PeakApp.tsx         ← Root app shell (client)
│   ├── Splash.tsx          ← Animated splash screen
│   ├── Topbar.tsx          ← Top navigation bar
│   ├── Sidebar.tsx         ← Left sidebar nav
│   ├── ui/
│   │   └── index.tsx       ← Shared primitives (rings, bars, cards)
│   └── screens/
│       ├── BriefScreen.tsx
│       ├── TrainScreen.tsx
│       ├── FuelScreen.tsx
│       ├── RecoverScreen.tsx
│       └── CoachScreen.tsx
├── lib/
│   └── data.ts             ← Types, mock data, constants
└── styles/
    └── globals.css         ← Design tokens, animations
```

## Next Steps

1. **AI** — Wire `CoachScreen` to Gemini API (see `/api/chat` route)
2. **Auth** — Add Supabase auth, replace `ATHLETE` mock with real user
3. **Data** — Connect `READINESS`, `NUTRITION`, `RECOVERY_BARS` to Supabase queries
4. **API route** — Create `src/app/api/chat/route.ts` for AI calls
