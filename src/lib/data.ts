export type Screen = 'brief' | 'train' | 'fuel' | 'recover' | 'coach' | 'profile' | 'analytics' | 'history' | 'goals' | 'settings' | 'devices' | 'injuries';

export interface Message {
  id: string;
  from: 'peak' | 'user';
  text: string;
  time: string;
  showWave?: boolean;
}

export const ATHLETE = {
  name: 'Marcus',
  initials: 'M',
  plan: 'PEAK PRO',
  sport: 'Strength & Conditioning',
  goal: 'Build lean muscle',
};

export const READINESS = {
  score: 74,
  sleep: { hours: '6h 20m', score: 69 },
  hrv: { value: '62ms', score: 78 },
  legFatigue: { value: 'HIGH', score: 85 },
  streak: { value: '8', score: 53 },
};

export const NUTRITION = {
  kcal: 2100,
  kcalGoal: 2800,
  protein: { current: 145, goal: 180 },
  carbs:   { current: 220, goal: 300 },
  fat:     { current: 55,  goal: 80  },
};

export const MEALS = [
  { emoji: '🍳', name: 'Breakfast',          time: '07:30 AM', kcal: 520, macros: 'P 34g · C 48g · F 18g' },
  { emoji: '🥗', name: 'Lunch',              time: '12:15 PM', kcal: 680, macros: 'P 52g · C 74g · F 20g' },
  { emoji: '🍌', name: 'Pre-workout snack',  time: '04:00 PM', kcal: 210, macros: 'P 8g · C 42g · F 2g'  },
  { emoji: '🍗', name: 'Dinner',             time: '07:45 PM', kcal: 690, macros: 'P 51g · C 56g · F 15g' },
];

export const RECOVERY_BARS = [
  { icon: '😴', label: 'Sleep Quality',  value: 82, color: 'var(--blue)'   },
  { icon: '💓', label: 'HRV Score',      value: 78, color: 'var(--accent)' },
  { icon: '🔥', label: 'Muscle Fatigue', value: 45, color: 'var(--orange)' },
  { icon: '🧠', label: 'Mental Load',    value: 60, color: 'var(--blue)'   },
  { icon: '🌡️', label: 'Skin Temp',     value: 97, color: 'var(--purple)' },
];

export const EXERCISES = [
  { name: 'Bench Press',      detail: '5 × 10 · 80kg', active: true  },
  { name: 'Incline DB Press', detail: '4 × 12 · 28kg', active: false },
  { name: 'Pull-ups',         detail: '4 × 8 · BW',    active: false },
  { name: 'Cable Row',        detail: '3 × 15 · 60kg', active: false },
  { name: 'Shoulder Press',   detail: '4 × 10 · 24kg', active: false },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: '1', from: 'peak',
    text: 'Your <strong>squat depth improved 12%</strong> this week. Your left knee still caves slightly on rep 4+. Focus on pushing your knees out actively.',
    time: '09:32 AM', showWave: true,
  },
  {
    id: '2', from: 'user',
    text: 'What should I eat before tonight\'s session?',
    time: '09:35 AM',
  },
  {
    id: '3', from: 'peak',
    text: 'Your session is at 6PM. Eat a <strong>medium-carb meal at 4PM</strong> — rice, chicken, some greens. Keep fat low. Then 30min before: banana + espresso. You\'ll be dialled in.',
    time: '09:35 AM',
  },
  {
    id: '4', from: 'user',
    text: 'How hard should I go today?',
    time: '09:41 AM',
  },
];

export const SUGGESTED_QUESTIONS = [
  { q: 'How hard should I train today?',       a: 'HRV at <strong>62ms</strong> and legs loaded — cap intensity at <strong>70%</strong> today. Upper body is fresh, push on pressing movements.' },
  { q: 'What should I eat before my session?', a: 'Eat at <strong>4PM</strong> — rice, chicken, greens. Keep fat low. 30 min before: banana + espresso. You\'ll be dialled in.' },
  { q: 'Analyse my recovery this week',         a: 'Recovery <strong>trending upward</strong> — from 68 Monday to 74 today. HRV improved 8ms. The extra sleep Tuesday made a measurable difference.' },
  { q: 'Am I overtraining?',                    a: 'Not yet, but you\'re close on legs. <strong>3 days of leg fatigue</strong> is a signal. Keep today upper body only and take a full rest day Thursday.' },
];

// Analytics Screen Data
export const ANALYTICS_DATA = {
  weekly: {
    workouts: { completed: 5, target: 6, trend: '+1 from last week' },
    volume: { total: 42500, unit: 'kg', trend: '+8% from last week' },
    avgIntensity: { value: 72, unit: '%', trend: '+5% from last week' },
    calories: { burned: 3200, trend: '+200 from last week' },
  },
  monthly: {
    workouts: { completed: 22, target: 24 },
    volume: { total: 178000, unit: 'kg' },
    avgIntensity: { value: 68, unit: '%' },
    calories: { burned: 13500 },
  },
  workoutTrends: [
    { day: 'Mon', duration: 65, intensity: 75 },
    { day: 'Tue', duration: 55, intensity: 60 },
    { day: 'Wed', duration: 70, intensity: 80 },
    { day: 'Thu', duration: 0, intensity: 0 },
    { day: 'Fri', duration: 60, intensity: 70 },
    { day: 'Sat', duration: 75, intensity: 85 },
    { day: 'Sun', duration: 0, intensity: 0 },
  ],
  calorieTrends: [
    { day: 'Mon', intake: 2400, burned: 520 },
    { day: 'Tue', intake: 2200, burned: 450 },
    { day: 'Wed', intake: 2600, burned: 580 },
    { day: 'Thu', intake: 2100, burned: 0 },
    { day: 'Fri', intake: 2500, burned: 480 },
    { day: 'Sat', intake: 2800, burned: 620 },
    { day: 'Sun', intake: 2300, burned: 0 },
  ],
  recoveryTrends: [
    { day: 'Mon', score: 68, hrv: 58 },
    { day: 'Tue', score: 72, hrv: 60 },
    { day: 'Wed', score: 70, hrv: 59 },
    { day: 'Thu', score: 65, hrv: 55 },
    { day: 'Fri', score: 74, hrv: 62 },
    { day: 'Sat', score: 78, hrv: 65 },
    { day: 'Sun', score: 76, hrv: 63 },
  ],
};

// History Screen Data
export const HISTORY_DATA = {
  workouts: [
    { id: '1', date: '2026-03-11', name: 'Upper Body Push', duration: '65 min', intensity: 75, exercises: 5, calories: 420 },
    { id: '2', date: '2026-03-10', name: 'Lower Body', duration: '70 min', intensity: 80, exercises: 6, calories: 520 },
    { id: '3', date: '2026-03-08', name: 'Upper Body Pull', duration: '55 min', intensity: 60, exercises: 4, calories: 350 },
    { id: '4', date: '2026-03-07', name: 'Cardio + Core', duration: '45 min', intensity: 55, exercises: 8, calories: 380 },
    { id: '5', date: '2026-03-05', name: 'Full Body', duration: '75 min', intensity: 85, exercises: 7, calories: 580 },
    { id: '6', date: '2026-03-04', name: 'Upper Body Push', duration: '60 min', intensity: 70, exercises: 5, calories: 400 },
    { id: '7', date: '2026-03-02', name: 'Lower Body', duration: '68 min', intensity: 78, exercises: 6, calories: 510 },
  ],
  meals: [
    { id: '1', date: '2026-03-11', name: 'Breakfast', time: '07:30 AM', kcal: 520, protein: 34, carbs: 48, fat: 18 },
    { id: '2', date: '2026-03-11', name: 'Lunch', time: '12:15 PM', kcal: 680, protein: 52, carbs: 74, fat: 20 },
    { id: '3', date: '2026-03-11', name: 'Dinner', time: '07:45 PM', kcal: 650, protein: 48, carbs: 55, fat: 22 },
    { id: '4', date: '2026-03-10', name: 'Breakfast', time: '07:15 AM', kcal: 480, protein: 30, carbs: 45, fat: 16 },
    { id: '5', date: '2026-03-10', name: 'Lunch', time: '12:30 PM', kcal: 720, protein: 55, carbs: 80, fat: 18 },
    { id: '6', date: '2026-03-10', name: 'Snack', time: '04:00 PM', kcal: 200, protein: 8, carbs: 38, fat: 3 },
    { id: '7', date: '2026-03-10', name: 'Dinner', time: '08:00 PM', kcal: 610, protein: 45, carbs: 50, fat: 20 },
  ],
  recovery: [
    { id: '1', date: '2026-03-11', score: 74, sleep: '6h 20m', hrv: 62, fatigue: 'HIGH' },
    { id: '2', date: '2026-03-10', score: 72, sleep: '6h 45m', hrv: 60, fatigue: 'MODERATE' },
    { id: '3', date: '2026-03-09', score: 78, sleep: '7h 15m', hrv: 65, fatigue: 'LOW' },
    { id: '4', date: '2026-03-08', score: 70, sleep: '6h 00m', hrv: 59, fatigue: 'MODERATE' },
    { id: '5', date: '2026-03-07', score: 68, sleep: '5h 45m', hrv: 58, fatigue: 'HIGH' },
    { id: '6', date: '2026-03-06', score: 75, sleep: '7h 00m', hrv: 63, fatigue: 'LOW' },
    { id: '7', date: '2026-03-05', score: 80, sleep: '8h 00m', hrv: 68, fatigue: 'LOW' },
  ],
};

// Goals Screen Data
export const GOALS_DATA = {
  active: [
    { id: '1', title: 'Build Lean Muscle', target: 'Gain 5kg muscle', current: '3.2kg', progress: 64, deadline: '2026-06-30', metric: 'muscle' },
    { id: '2', title: 'Reduce Body Fat', target: 'From 18% to 14%', current: '15.8%', progress: 72, deadline: '2026-06-30', metric: 'bodyFat' },
    { id: '3', title: 'Improve Strength', target: 'Bench 100kg', current: '85kg', progress: 70, deadline: '2026-05-15', metric: 'strength' },
    { id: '4', title: 'Consistency Streak', target: '30 workout days', current: '18 days', progress: 60, deadline: '2026-04-30', metric: 'streak' },
  ],
  completed: [
    { id: '5', title: 'Run 5K', target: 'Under 25 min', achieved: '24:30', date: '2026-02-15', metric: 'cardio' },
  ],
  weeklyTargets: [
    { id: '1', title: 'Workouts', current: 5, target: 6, unit: 'sessions' },
    { id: '2', title: 'Protein', current: 145, target: 180, unit: 'g' },
    { id: '3', title: 'Sleep Avg', current: '6h 45m', target: '7h 30m', unit: 'hours' },
    { id: '4', title: 'Recovery Score', current: 74, target: 80, unit: 'points' },
  ],
};
