import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getTodayMealPlan, 
  getMealPlanByDate,
  createMealPlan, 
  updateMealPlan,
  markMealEaten,
  deleteMealPlan,
  PlannedMeal
} from '@/lib/models/meal-plan';
import { getUserGoals } from '@/lib/models/user-goals';
import { chatCompletion } from '@/lib/groq';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const targetDate = date || new Date().toISOString().split('T')[0];

    const mealPlan = await getMealPlanByDate(userId, targetDate);
    
    return NextResponse.json(mealPlan || null);
  } catch (error) {
    console.error('Get meal plan error:', error);
    return NextResponse.json({ error: 'Failed to get meal plan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const body = await req.json();
    const { action } = body;

    if (action === 'generate') {
      const goals = await getUserGoals(userId);
      
      if (!goals) {
        return NextResponse.json({ error: 'No goals set. Please set your nutrition goals first.' }, { status: 400 });
      }

      const today = new Date().toISOString().split('T')[0];

      const systemPrompt = `You are **Chef PEAK**, a sports nutritionist. Create a personalized daily meal plan.

## User's Goals
- Daily Calories: ${goals.dailyCalorieGoal} kcal
- Goal Type: ${goals.goalType}
- Protein: ${goals.proteinGoal}g | Carbs: ${goals.carbsGoal}g | Fat: ${goals.fatGoal}g

## Your Job
Create a complete daily meal plan. YOU decide:
- How many meals (can be 2-6 meals depending on the person's schedule and preferences)
- What times to eat (breakfast, lunch, dinner, snacks, etc.)
- Each meal name, calories, and macros

The meals should:
1. Add up to approximately the daily calorie goal
2. Be realistic, practical, and delicious
3. Consider the goal type:
   - CUT: Higher protein, moderate carbs, lower fat, calorie deficit (~500 kcal below maintenance)
   - BULK: Higher calories, high carbs, moderate protein, calorie surplus (~300-500 kcal above maintenance)
   - MAINTAIN: Balanced macros, at maintenance calories

## Output Format (JSON ONLY - no other text)
Respond with a JSON array of meals:
[
  {"timing": "breakfast", "name": "Oatmeal with protein powder and berries", "calories": 450, "protein": 35, "carbs": 55, "fat": 12},
  {"timing": "lunch", "name": "Grilled chicken breast with rice and vegetables", "calories": 550, "protein": 45, "carbs": 60, "fat": 15},
  {"timing": "dinner", "name": "Salmon with sweet potato", "calories": 500, "protein": 40, "carbs": 45, "fat": 18},
  {"timing": "snack", "name": "Greek yogurt with almonds", "calories": 250, "protein": 18, "carbs": 15, "fat": 14}
]

Only output valid JSON, no explanation or extra text.`;

      const response = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a meal plan for today (${today}) for my ${goals.goalType} goal. Make it practical and delicious!` }
      ], {
        temperature: 0.7,
        maxTokens: 800,
      });

      let meals: Omit<PlannedMeal, 'id' | 'eaten'>[] = [];
      
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          meals = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Failed to parse meal plan JSON:', parseError);
        return NextResponse.json({ error: 'Failed to generate meal plan' }, { status: 500 });
      }

      if (!meals || meals.length === 0) {
        return NextResponse.json({ error: 'Failed to generate meal plan' }, { status: 500 });
      }

      const mealPlan = await createMealPlan(userId, today, meals, goals.goalType as 'bulk' | 'cut' | 'maintain');
      
      return NextResponse.json(mealPlan);
    }

    if (action === 'mark_eaten') {
      const { mealId, eaten, date } = body;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      if (!mealId || eaten === undefined) {
        return NextResponse.json({ error: 'mealId and eaten required' }, { status: 400 });
      }

      const mealPlan = await markMealEaten(userId, targetDate, mealId, eaten);
      return NextResponse.json(mealPlan);
    }

    if (action === 'delete') {
      const { date } = body;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      await deleteMealPlan(userId, targetDate);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Meal plan error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
