import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserWorkouts, createWorkout, getWorkoutById, updateWorkout, deleteWorkout } from '@/lib/models/workout';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workouts = await getUserWorkouts(session.user.id, session.user.email || undefined);
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
