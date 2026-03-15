import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateOpenWearablesUser } from '@/lib/openwearables';
import { saveMultipleStravaWorkouts, getUserStravaWorkouts, updateWorkoutCalories, getStravaWorkoutsByDateRange } from '@/lib/models/strava-workout';
import { updateDailySummary, getUserDailySummaries, getDailySummaryCollection } from '@/lib/models/daily-summary';
import { estimateCaloriesWithAI } from '@/lib/calories';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.email;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let workouts;
    if (startDate && endDate) {
      workouts = await getStravaWorkoutsByDateRange(userId, startDate, endDate, limit);
    } else {
      workouts = await getUserStravaWorkouts(userId, limit);
    }
    
    const summaries = await getUserDailySummaries(userId, '2025-01-01', '2030-12-31');
    return NextResponse.json({ workouts, summaries });
  } catch (error) {
    console.error('Failed to fetch workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.email;

  try {
    const body = await request.json();
    const { workouts, estimateCalories } = body;

    if (!workouts || !Array.isArray(workouts)) {
      return NextResponse.json({ error: 'Workouts array required' }, { status: 400 });
    }

    const saved = await saveMultipleStravaWorkouts(userId, workouts);
    
    let updatedCount = 0;
    const caloriesByDate: Record<string, number> = {};
    
    if (estimateCalories) {
      const allWorkouts = await getUserStravaWorkouts(userId, 50);
      
      for (const workout of allWorkouts) {
        if (!workout.estimatedCalories) {
          const estimated = await estimateCaloriesWithAI(
            workout.duration,
            workout.distance,
            workout.elevation,
            workout.avgSpeed || 0,
            workout.sportType || workout.type
          );
          
          await updateWorkoutCalories(workout._id.toString(), estimated);
          updatedCount++;
          
          const date = workout.startDate?.split('T')[0];
          if (date) {
            caloriesByDate[date] = (caloriesByDate[date] || 0) + estimated;
          }
        }
      }
      
      for (const [date, calories] of Object.entries(caloriesByDate)) {
        const collection = await getDailySummaryCollection();
        await collection.updateOne(
          { userId, date },
          { 
            $inc: { caloriesBurned: calories, workoutsCompleted: 1 },
            $set: { updatedAt: new Date() }
          },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ 
      saved, 
      caloriesEstimated: updatedCount,
      message: `Saved ${saved} workouts${updatedCount > 0 ? `, estimated calories for ${updatedCount}` : ''}` 
    });
  } catch (error) {
    console.error('Failed to save workouts:', error);
    return NextResponse.json({ error: 'Failed to save workouts' }, { status: 500 });
  }
}
