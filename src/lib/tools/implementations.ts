import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserGoals } from '@/lib/models/user-goals';
import { getTodayMealPlan, createMealPlan, deleteMealPlan } from '@/lib/models/meal-plan';
import { getActiveInjuries, getUserInjuries, createInjury, markInjuryRecovered } from '@/lib/models/injury';
import { getUserDailySummaries, getTodaySummary } from '@/lib/models/daily-summary';
import { getTodayMeals } from '@/lib/models/meal';
import { getUserStravaWorkouts } from '@/lib/models/strava-workout';
import { chatCompletion } from '@/lib/groq';

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
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

export const TOOL_FUNCTIONS: Record<string, (args?: any) => Promise<ToolResult>> = {
  get_user_goals,
  get_readiness_data,
  get_today_nutrition,
  get_meal_plan,
  create_meal_plan,
  get_recent_workouts,
  get_injuries,
  add_injury,
  mark_injury_recovered,
  get_daily_summary,
};
