import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { getTodayMeals, addMeal, getMealsByDate, deleteMeal as deleteMealFromDb, getMealsCollection, getMealsByDateRange } from '@/lib/models/meal';
import { updateDailySummary } from '@/lib/models/daily-summary';

async function syncCaloriesToSummary(userId: string, date: string) {
  const meals = await getMealsByDate(userId, date);
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  await updateDailySummary(userId, date, { caloriesFromFood: totalCalories });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const userId = session.user.email;

    // Date range query for history
    if (startDate && endDate) {
      const meals = await getMealsByDateRange(userId, startDate, endDate);
      return NextResponse.json({ meals });
    }

    // Single date or today's meals

    let meals;
    if (date) {
      meals = await getMealsByDate(userId, date);
    } else {
      meals = await getTodayMeals(userId);
    }

    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
    const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
    const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

    const today = new Date().toISOString().split('T')[0];
    await syncCaloriesToSummary(userId, today);

    return NextResponse.json({
      meals,
      totals: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      },
    });
  } catch (error) {
    console.error('Get meals error:', error);
    return NextResponse.json({ error: 'Failed to get meals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, calories, protein, carbs, fat, servingSize } = body;

    if (!name || !calories) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const meal = await addMeal({
      userId: session.user.email,
      name,
      calories,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      servingSize: servingSize || '1 serving',
    });

    const today = new Date().toISOString().split('T')[0];
    await syncCaloriesToSummary(session.user.email, today);

    return NextResponse.json(meal);
  } catch (error) {
    console.error('Add meal error:', error);
    return NextResponse.json({ error: 'Failed to add meal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Meal ID required' }, { status: 400 });
    }

    const mealsCollection = await getMealsCollection();
    const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });
    
    await deleteMealFromDb(id);
    
    if (meal?.date) {
      await syncCaloriesToSummary(session.user.email, meal.date);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete meal error:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
