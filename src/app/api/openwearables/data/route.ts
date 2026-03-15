import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getOrCreateOpenWearablesUser,
  getUserWorkouts,
  getUserSleep,
  getUserTimeseries,
  getActivitySummary,
  getSleepSummary,
  getRecoverySummary,
  getBodySummary,
  syncProviderData
} from '@/lib/openwearables';
import { getDailySummaryCollection } from '@/lib/models/daily-summary';
import { saveMultipleStravaWorkouts, updateWorkoutCalories, getUserStravaWorkouts } from '@/lib/models/strava-workout';
import { estimateCaloriesWithAI } from '@/lib/calories';

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.email || session.user.id;

  const searchParams = request.nextUrl.searchParams;
  const dataType = searchParams.get('type') || 'summary';
  const date = searchParams.get('date');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const types = searchParams.get('types')?.split(',').filter(Boolean) || [];

  try {
    const owUserId = await getOrCreateOpenWearablesUser(session.user.id);
    if (!owUserId) {
      return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
    }

    let data;
    const dateStr = date || new Date().toISOString().split('T')[0];
    const defaultStart = getDefaultStartDate();
    const defaultEnd = getDefaultEndDate();
    const workoutStartDate = searchParams.get('start_date') || defaultStart;
    const workoutEndDate = searchParams.get('end_date') || defaultEnd;

    switch (dataType) {
      case 'workouts':
        data = await getUserWorkouts(owUserId, workoutStartDate, workoutEndDate);
        break;
      case 'sleep':
        data = await getUserSleep(owUserId, workoutStartDate, workoutEndDate);
        break;
      case 'timeseries':
        const startTime = searchParams.get('start_time') || `${dateStr}T00:00:00Z`;
        const endTime = searchParams.get('end_time') || `${dateStr}T23:59:59Z`;
        data = await getUserTimeseries(owUserId, types.length ? types : ['heart_rate', 'steps'], startTime, endTime);
        break;
      case 'activity':
        data = await getActivitySummary(owUserId, dateStr);
        break;
      case 'sleep-summary':
        data = await getSleepSummary(owUserId, dateStr);
        break;
      case 'recovery':
        data = await getRecoverySummary(owUserId, dateStr);
        break;
      case 'body':
        data = await getBodySummary(owUserId, dateStr);
        break;
      case 'summary':
      default:
        const [activity, sleep, recovery, body] = await Promise.all([
          getActivitySummary(owUserId, dateStr),
          getSleepSummary(owUserId, dateStr),
          getRecoverySummary(owUserId, dateStr),
          getBodySummary(owUserId, dateStr),
        ]);
        data = { activity, sleep, recovery, body };

        await syncToDailySummary(userId, dateStr, activity, sleep, recovery);
        break;
    }

    return NextResponse.json({ owUserId, dataType, data });
  } catch (error) {
    console.error('OpenWearables data error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.email || session.user.id;

  try {
    const body = await request.json();
    const { provider, data_type } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const owUserId = await getOrCreateOpenWearablesUser(session.user.id);
    console.log('OpenWearables user ID:', owUserId);
    if (!owUserId) {
      return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
    }

    // Skip async sync, fetch directly
    let workoutsSaved = 0;
    if (provider === 'strava' && owUserId) {
      try {
        const workouts = await getUserWorkouts(owUserId, '2025-01-01', '2030-12-31');
        console.log('Fetched workouts from Strava:', workouts?.length);
        
        if (workouts && Array.isArray(workouts) && workouts.length > 0) {
          const formattedWorkouts = workouts.map((w: any) => ({
            id: w.id || w.workout_id || w.upload_id,
            name: w.name || w.title || w.type || 'Workout',
            type: w.type || 'Activity',
            sport_type: w.sport_type || w.type,
            start_date: w.start_date || w.start_date_local || w.date,
            start_date_local: w.start_date_local || w.start_date,
            moving_time: w.moving_time || w.elapsed_time || w.duration || 0,
            distance: w.distance || 0,
            total_elevation_gain: w.total_elevation_gain || 0,
            calories: w.calories || 0,
            average_speed: w.average_speed,
            elapsed_time: w.elapsed_time,
          }));
          
          await saveMultipleStravaWorkouts(userId, formattedWorkouts);
          workoutsSaved = formattedWorkouts.length;
          console.log('Saved workouts:', workoutsSaved);
          
          const allWorkouts = await getUserStravaWorkouts(userId, 500);
          for (const w of allWorkouts) {
            if (!w.estimatedCalories || w.estimatedCalories === 0) {
              const estimated = await estimateCaloriesWithAI(
                w.duration,
                w.distance,
                w.elevation,
                w.avgSpeed || 0,
                w.sportType
              );
              await updateWorkoutCalories(w._id.toString(), estimated);
            }
          }
          
          workoutsSaved = formattedWorkouts.length;
        }
      } catch (err) {
        console.error('Failed to save workouts after sync:', err);
      }
    }

    return NextResponse.json({ owUserId, provider, workoutsSaved });
  } catch (error) {
    console.error('OpenWearables sync error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function syncToDailySummary(
  userId: string,
  date: string,
  activity: any,
  sleep: any,
  recovery: any
) {
  try {
    const collection = await getDailySummaryCollection();
    const existing = await collection.findOne({ userId, date });

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (activity) {
      if (activity.steps) updateData.steps = activity.steps;
      if (activity.active_minutes) updateData.activeMinutes = activity.active_minutes;
    }

    if (sleep) {
      if (sleep.total_duration) updateData.sleepHours = Math.round(sleep.total_duration / 3600 * 10) / 10;
      if (sleep.score) updateData.sleepScore = sleep.score;
    }

    if (recovery) {
      if (recovery.hrv) updateData.hrv = recovery.hrv;
    }

    if (existing) {
      await collection.updateOne({ userId, date }, { $set: updateData });
    } else {
      await collection.insertOne({
        userId,
        date,
        caloriesBurned: 0,
        caloriesFromFood: 0,
        steps: activity?.steps || 0,
        activeMinutes: activity?.active_minutes || 0,
        workoutsCompleted: 0,
        sleepHours: sleep?.total_duration ? Math.round(sleep.total_duration / 3600 * 10) / 10 : undefined,
        sleepScore: sleep?.score,
        hrv: recovery?.hrv,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }
  } catch (error) {
    console.error('Failed to sync to daily summary:', error);
  }
}
