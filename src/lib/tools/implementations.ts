import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserGoals } from '@/lib/models/user-goals';
import { getTodayMealPlan, createMealPlan, deleteMealPlan } from '@/lib/models/meal-plan';
import { getActiveInjuries, getUserInjuries, createInjury, markInjuryRecovered } from '@/lib/models/injury';
import { getUserDailySummaries, getTodaySummary } from '@/lib/models/daily-summary';
import { getTodayMeals } from '@/lib/models/meal';
import { getUserStravaWorkouts } from '@/lib/models/strava-workout';
import { getUserWorkouts, createWorkout, getAllExercises } from '@/lib/models/workout';
import { getDatabase } from '@/lib/mongodb';
import { chatCompletion } from '@/lib/groq';

async function logWaterToDb(userId: string, amount: number) {
  const db = await getDatabase();
  const collection = db.collection('water_logs');
  const today = new Date().toISOString().split('T')[0];
  const existing = await collection.findOne({ userId, date: today });
  if (existing) {
    await collection.updateOne({ _id: existing._id }, { $inc: { amount } });
  } else {
    await collection.insertOne({ userId, date: today, amount, createdAt: new Date() });
  }
}

async function getWaterFromDb(userId: string) {
  const db = await getDatabase();
  const collection = db.collection('water_logs');
  const today = new Date().toISOString().split('T')[0];
  const log = await collection.findOne({ userId, date: today });
  return log?.amount || 0;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  _redirect?: { type: 'workout' | 'meal'; id: string } | null;
}

async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  return session?.user?.email || '';
}

export async function get_user_goals(): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const goals = await getUserGoals(userId);
    return { success: true, data: goals };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function get_readiness_data(args?: { days?: number }): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const days = args?.days || 7;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const summaries = await getUserDailySummaries(userId, startDate, endDate);
    
    const readinessData = summaries.map((s: any) => ({
      date: s.date,
      readinessScore: s.sleepScore || Math.round((s.hrv || 50) * 1.2),
      hrv: s.hrv,
      sleepHours: s.sleepHours,
      fatigue: s.hrv && s.hrv > 60 ? 'LOW' : s.hrv && s.hrv > 50 ? 'MODERATE' : 'HIGH',
    }));
    
    return { success: true, data: readinessData };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function get_today_nutrition(): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const meals = await getTodayMeals(userId);
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
    const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
    const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);
    
    return { 
      success: true, 
      data: { 
        meals: meals.map(m => ({
          name: m.name,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          time: m.time,
        })),
        totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      } 
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function log_water(args: { amount: number | string }): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const amount = typeof args.amount === 'string' ? parseInt(args.amount, 10) : args.amount;
    
    if (isNaN(amount)) {
      return { success: false, error: 'Invalid amount' };
    }

    await logWaterToDb(userId, amount);

    const goals = await getUserGoals(userId);
    const waterGoal = goals?.waterGoal || 2500;
    const totalToday = await getWaterFromDb(userId);

    return { 
      success: true, 
      data: { 
        amount,
        totalToday,
        goal: waterGoal,
        percentage: Math.round((totalToday / waterGoal) * 100),
      } 
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function get_water_intake(): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const goals = await getUserGoals(userId);
    const waterGoal = goals?.waterGoal || 2500;
    const totalToday = await getWaterFromDb(userId);

    return { 
      success: true, 
      data: { 
        amount: totalToday || 0,
        goal: waterGoal,
        percentage: Math.round(((totalToday || 0) / waterGoal) * 100),
      } 
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function get_meal_plan(): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const mealPlan = await getTodayMealPlan(userId);
    return { success: true, data: mealPlan };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function create_meal_plan(): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const goals = await getUserGoals(userId);
    if (!goals) return { success: false, error: 'No goals set. Ask user to set nutrition goals first.' };
    
    const today = new Date().toISOString().split('T')[0];
    await deleteMealPlan(userId, today);
    
    const systemPrompt = `You are **Chef PEAK**, a sports nutritionist. Create a personalized daily meal plan.

## User's Goals
- Daily Calories: ${goals.dailyCalorieGoal} kcal
- Goal Type: ${goals.goalType}
- Protein: ${goals.proteinGoal}g | Carbs: ${goals.carbsGoal}g | Fat: ${goals.fatGoal}g

## Your Job
Create a complete daily meal plan. YOU decide:
- How many meals (can be 2-6 meals)
- What times to eat
- Each meal name, calories, and macros

The meals should:
1. Add up to approximately the daily calorie goal
2. Be realistic and practical
3. Consider the goal type (CUT/BULK/MAINTAIN)

## Output Format (JSON ONLY)
[
  {"timing": "breakfast", "name": "Meal name", "calories": 500, "protein": 30, "carbs": 50, "fat": 15}
]

Only output valid JSON.`;

    const response = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Create a meal plan for today' }
    ], {
      temperature: 0.9,
      maxTokens: 600,
    });

    let meals: any[] = [];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) meals = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return { success: false, error: 'Failed to parse meal plan' };
    }

    if (!meals.length) return { success: false, error: 'Failed to generate meals' };

    const mealPlan = await createMealPlan(userId, today, meals, goals.goalType as 'bulk' | 'cut' | 'maintain');
    return { success: true, data: mealPlan };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function get_recent_workouts(args?: { limit?: number }): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const limit = args?.limit || 10;
    const workouts = await getUserStravaWorkouts(userId, limit);
    
    return { 
      success: true, 
      data: workouts.map((w: any) => ({
        name: w.name,
        date: w.startDate?.split('T')[0],
        duration: Math.round((w.duration || 0) / 60),
        calories: w.estimatedCalories || w.calories || 0,
        type: w.sportType || w.type,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function get_injuries(args?: { active_only?: boolean }): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const injuries = args?.active_only 
      ? await getActiveInjuries(userId)
      : await getUserInjuries(userId);
    
    return { 
      success: true, 
      data: injuries.map((i: any) => ({
        id: i._id?.toString(),
        name: i.name,
        bodyPart: i.bodyPart,
        description: i.description,
        status: i.status,
        severity: i.severity,
        notes: i.notes,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function add_injury(args: { 
  name?: string; 
  body_part?: string; 
  description?: string; 
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
}): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const injury = await createInjury(userId, {
      name: args.name || 'Unspecified injury',
      bodyPart: args.body_part || 'Unknown',
      description: args.description,
      severity: args.severity || 'moderate',
      notes: args.notes,
    });
    
    return { success: true, data: injury };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function mark_injury_recovered(args: { injury_id: string }): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const today = new Date().toISOString().split('T')[0];
    const injury = await markInjuryRecovered(args.injury_id, today);
    
    return { success: true, data: injury };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function get_daily_summary(args?: { days?: number }): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const days = args?.days || 7;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const summaries = await getUserDailySummaries(userId, startDate, endDate);
    
    return { 
      success: true, 
      data: summaries.map((s: any) => ({
        date: s.date,
        caloriesBurned: s.caloriesBurned || 0,
        caloriesFromFood: s.caloriesFromFood || 0,
        steps: s.steps || 0,
        activeMinutes: s.activeMinutes || 0,
        workoutsCompleted: s.workoutsCompleted || 0,
        sleepHours: s.sleepHours,
        sleepScore: s.sleepScore,
        hrv: s.hrv,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

const WORKOUT_TEMPLATES: Record<string, { muscles: string[]; exercises: string[] }> = {
  push: {
    muscles: ['Chest', 'Shoulders', 'Triceps'],
    exercises: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Lateral Raises', 'Tricep Pushdowns', 'Cable Flyes'],
  },
  pull: {
    muscles: ['Back', 'Biceps', 'Rear Delts'],
    exercises: ['Deadlift', 'Pull-ups', 'Barbell Rows', 'Face Pulls', 'Bicep Curls', 'Lat Pulldowns'],
  },
  legs: {
    muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    exercises: ['Squats', 'Leg Press', 'Romanian Deadlift', 'Leg Curls', 'Leg Extensions', 'Calf Raises', 'Lunges'],
  },
  upper: {
    muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
    exercises: ['Bench Press', 'Pull-ups', 'Overhead Press', 'Barbell Rows', 'Bicep Curls', 'Tricep Pushdowns'],
  },
  lower: {
    muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'],
    exercises: ['Squats', 'Leg Press', 'Romanian Deadlift', 'Leg Curls', 'Calf Raises', 'Planks'],
  },
  full_body: {
    muscles: ['Full Body'],
    exercises: ['Squats', 'Deadlift', 'Bench Press', 'Pull-ups', 'Overhead Press', 'Rows', 'Lunges', 'Planks'],
  },
  ppl: {
    muscles: ['Push', 'Pull', 'Legs'],
    exercises: ['Push: Bench, Shoulder Press, Triceps', 'Pull: Deadlift, Pull-ups, Rows, Biceps', 'Legs: Squats, Leg Press, Curls'],
  },
};

export async function generate_workout(args: { 
  split_type?: string; 
  muscle_focus?: string; 
  num_exercises?: number;
}): Promise<ToolResult> {
  try {
    let exercises: any[] = [];
    try {
      exercises = await getAllExercises();
      console.log('[generate_workout] Exercises from DB:', exercises.length);
    } catch (e) {
      console.log('[generate_workout] No exercises in DB, using defaults', e);
    }

    const splitInput = args.split_type || '';
    const validSplits = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'ppl'];
    const splitType = validSplits.includes(splitInput) ? splitInput : 'full_body';
    const numExercises = typeof args.num_exercises === 'number' ? args.num_exercises : parseInt(String(args.num_exercises || '6')) || 6;
    const template = WORKOUT_TEMPLATES[splitType] || WORKOUT_TEMPLATES.full_body;
    
    let selected: any[] = [];
    
    // Try to use exercises from database
    if (exercises.length > 0) {
      const targetMuscles = args.muscle_focus 
        ? [args.muscle_focus]
        : template.muscles;

      const filtered = exercises.filter((ex: any) => 
        ex.muscleGroups?.some((mg: string) => 
          targetMuscles.some(t => mg.toLowerCase().includes(t.toLowerCase()))
        )
      );

      const used = new Set<string>();
      
      for (let i = 0; i < Math.min(numExercises, filtered.length); i++) {
        const available = filtered.filter((ex: any) => !used.has(ex.name));
        if (!available.length) break;
        
        const randomIdx = Math.floor(Math.random() * available.length);
        const exercise = available[randomIdx];
        used.add(exercise.name);
        
        selected.push({
          name: exercise.name,
          sets: 3,
          reps: '8-12',
          rest_seconds: 60,
          muscle_groups: exercise.muscleGroups,
        });
      }
    }

    // Fallback to template exercises if no database exercises
    if (selected.length === 0) {
      for (const exName of template.exercises.slice(0, numExercises)) {
        selected.push({
          name: exName,
          sets: 3,
          reps: '8-12',
          rest_seconds: 60,
        });
      }
    }

    const splitNames: Record<string, string> = {
      push: 'Push Day',
      pull: 'Pull Day', 
      legs: 'Leg Day',
      upper: 'Upper Body',
      lower: 'Lower Body',
      full_body: 'Full Body',
      ppl: 'PPL',
    };

    const workoutName = splitNames[splitType] || 'Workout';
    const targetMuscles = args.muscle_focus 
      ? [args.muscle_focus]
      : (WORKOUT_TEMPLATES[splitType]?.muscles || ['Full Body']);

    // Auto-save to database
    const userId = await getUserId();
    let savedWorkout = null;
    if (userId) {
      try {
        const exercisesForDb = selected.map((e: any) => ({
          exerciseId: '',
          exerciseName: e.name,
          sets: e.sets || 3,
          reps: String(e.reps || '8-12'),
          restSeconds: e.rest_seconds || 60,
        }));
        savedWorkout = await createWorkout({
          userId,
          name: workoutName,
          exercises: exercisesForDb,
          estimatedDuration: exercisesForDb.length * 15,
        });
      } catch (e) {
        console.error('Failed to auto-save workout:', e);
      }
    }
    
    const workoutId = savedWorkout ? savedWorkout._id.toString() : null;
    
    return {
      success: true,
      data: {
        name: workoutName,
        split_type: splitType,
        exercises: selected,
        saved: !!savedWorkout,
        workout_id: workoutId,
        notes: `A ${splitType} workout targeting ${targetMuscles.join(', ')}. ${savedWorkout ? 'Saved to your workouts!' : ''}`,
      },
      _redirect: workoutId ? { type: 'workout' as const, id: workoutId } : null,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function save_workout(args: { name?: string; exercises?: any[] }): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    if (!args.name) return { success: false, error: 'Workout name is required' };
    if (!args.exercises || args.exercises.length === 0) return { success: false, error: 'No exercises to save' };

    const exercises = args.exercises.map((e: any) => ({
      exerciseId: '',
      exerciseName: e.name,
      sets: e.sets || 3,
      reps: String(e.reps || '8-12'),
      restSeconds: e.rest_seconds || 60,
    }));

    const workout = await createWorkout({
      userId,
      name: args.name,
      exercises,
      estimatedDuration: exercises.length * 15,
    });

    return { success: true, data: { id: workout._id.toString(), name: workout.name } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function get_workouts(): Promise<ToolResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };
    
    const workouts = await getUserWorkouts(userId);
    
    return {
      success: true,
      data: workouts.map(w => ({
        id: w._id.toString(),
        name: w.name,
        exercises: w.exercises.map(e => ({
          name: e.exerciseName,
          sets: e.sets,
          reps: e.reps,
          rest_seconds: e.restSeconds,
        })),
        exerciseCount: w.exercises.length,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export const TOOL_FUNCTIONS: Record<string, (args?: any) => Promise<ToolResult>> = {
  get_user_goals,
  get_readiness_data,
  get_today_nutrition,
  get_meal_plan,
  create_meal_plan,
  log_water,
  get_water_intake,
  get_recent_workouts,
  get_injuries,
  add_injury,
  mark_injury_recovered,
  get_daily_summary,
  generate_workout,
  save_workout,
  get_workouts,
};
