import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateDailySummary, updateDailySummary, getTodaySummary, addCaloriesBurned, getDailySummaryCollection, getUserDailySummaries } from '@/lib/models/daily-summary';
import { getUserStravaWorkouts } from '@/lib/models/strava-workout';
import { getMealsByDate } from '@/lib/models/meal';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const rebuild = searchParams.get('rebuild');

    if (startDate && endDate) {
      const summaries = await getUserDailySummaries(userId, startDate, endDate);
      return NextResponse.json({ summaries });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    if (rebuild === 'true') {
      await rebuildDailySummary(userId, targetDate);
    }

    const collection = await getDailySummaryCollection();
    let summary = await collection.findOne({ userId, date: targetDate });

    if (!summary) {
      summary = await getOrCreateDailySummary(userId, targetDate);
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Get daily summary error:', error);
    return NextResponse.json({ error: 'Failed to get daily summary' }, { status: 500 });
  }
}

async function rebuildDailySummary(userId: string, date: string) {
  const workouts = await getUserStravaWorkouts(userId, 500);
  const dayWorkouts = workouts.filter(w => w.startDate?.startsWith(date));

  let caloriesBurned = 0;
  let activeMinutes = 0;
  let workoutsCompleted = dayWorkouts.length;

  for (const w of dayWorkouts) {
    caloriesBurned += w.estimatedCalories || w.calories || 0;
    activeMinutes += Math.round((w.duration || 0) / 60);
  }

  const meals = await getMealsByDate(userId, date);
  const caloriesFromFood = meals.reduce((sum, m) => sum + m.calories, 0);

  await updateDailySummary(userId, date, {
    caloriesBurned,
    caloriesFromFood,
    activeMinutes,
    workoutsCompleted,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const body = await req.json();
    const { date, caloriesBurned, caloriesFromFood, steps, activeMinutes, workoutsCompleted, sleepHours, sleepScore, hrv } = body;

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const updateData: any = {};
    if (caloriesBurned !== undefined) updateData.caloriesBurned = caloriesBurned;
    if (caloriesFromFood !== undefined) updateData.caloriesFromFood = caloriesFromFood;
    if (steps !== undefined) updateData.steps = steps;
    if (activeMinutes !== undefined) updateData.activeMinutes = activeMinutes;
    if (workoutsCompleted !== undefined) updateData.workoutsCompleted = workoutsCompleted;
    if (sleepHours !== undefined) updateData.sleepHours = sleepHours;
    if (sleepScore !== undefined) updateData.sleepScore = sleepScore;
    if (hrv !== undefined) updateData.hrv = hrv;

    const summary = await updateDailySummary(userId, targetDate, updateData);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Update daily summary error:', error);
    return NextResponse.json({ error: 'Failed to update daily summary' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    const results: { date: string; success: boolean; error?: string }[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      try {
        await rebuildDailySummary(userId, dateStr);
        results.push({ date: dateStr, success: true });
      } catch (err: any) {
        results.push({ date: dateStr, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({ 
      message: `Rebuilt ${successCount} of ${results.length} days`,
      results 
    });
  } catch (error) {
    console.error('Rebuild daily summaries error:', error);
    return NextResponse.json({ error: 'Failed to rebuild daily summaries' }, { status: 500 });
  }
}
