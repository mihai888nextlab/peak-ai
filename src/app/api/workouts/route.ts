import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserWorkouts, createWorkout, getWorkoutById, updateWorkout, deleteWorkout } from '@/lib/models/workout';
import { addCaloriesBurned } from '@/lib/models/daily-summary';
import { chatCompletion } from '@/lib/groq';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    const workouts = await getUserWorkouts(session.user.id, session.user.email || undefined, date);
    return NextResponse.json({ workouts });
  } catch (error) {
    console.error('Failed to fetch workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, exercises, estimatedDuration } = body;

    if (!name || !exercises?.length) {
      return NextResponse.json({ error: 'Name and exercises required' }, { status: 400 });
    }

    const workout = await createWorkout({
      userId: session.user.id,
      name,
      exercises,
      estimatedDuration: estimatedDuration || exercises.length * 10,
    });

    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Failed to create workout:', error);
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 });
  }
}

async function estimateCalories(workout: any): Promise<number> {
  const totalSets = workout.exercises.reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0);
  const exerciseList = workout.exercises
    .map((ex: any) => `- ${ex.exerciseName}: ${ex.sets} sets x ${ex.reps} reps`)
    .join('\n');

  const prompt = `Estimate calories burned for this workout.

Workout: ${workout.name}
Total exercises: ${workout.exercises.length}
Total sets: ${totalSets}
${exerciseList}

Consider:
1. Compound exercises (squat, deadlift, bench, rows, overhead press) = HIGH intensity (~8-10 cal/min)
2. Isolation exercises (curls, extensions, raises) = MEDIUM intensity (~4-6 cal/min)
3. More sets = more calories
4. Estimate duration: ~2-3 min per set including rest

Calculate: sum of (exercise intensity x estimated minutes per exercise)

Respond with ONLY a number.`;

  try {
    const result = await chatCompletion([
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      maxTokens: 10,
    });

    const calories = parseInt(result.trim(), 10);
    if (isNaN(calories) || calories < 0 || calories > 2000) {
      return Math.round(totalSets * 8);
    }
    return calories;
  } catch (error) {
    console.error('Failed to estimate calories:', error);
    return Math.round(totalSets * 8);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.email || session.user.id;

  try {
    const body = await request.json();
    const { workoutId, action } = body;

    if (action === 'complete') {
      const workout = await getWorkoutById(workoutId);
      if (!workout) {
        return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
      }

      const caloriesBurned = await estimateCalories(workout);
      const today = new Date().toISOString().split('T')[0];

      console.log('[completeWorkout] userId:', userId, 'email:', session.user.email, 'today:', today, 'calories:', caloriesBurned);

      const updatedWorkout = await updateWorkout(workoutId, { 
        lastCompletedAt: new Date(),
        caloriesBurned,
      });

      await addCaloriesBurned(userId, today, caloriesBurned);
      console.log('[completeWorkout] Added calories to daily summary');

      return NextResponse.json({ workout: updatedWorkout, caloriesBurned });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update workout:', error);
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Workout ID required' }, { status: 400 });
    }

    const deleted = await deleteWorkout(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete workout:', error);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
}
