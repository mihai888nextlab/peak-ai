import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSessionById, updateSession } from '@/lib/models/workout';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workoutSession = await getSessionById(params.id);
    if (!workoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (workoutSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ session: workoutSession });
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workoutSession = await getSessionById(params.id);
    if (!workoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (workoutSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { exercises, endTime, status, notes } = body;

    const updateData: any = {};
    if (exercises !== undefined) updateData.exercises = exercises;
    if (endTime) updateData.endTime = new Date(endTime);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await updateSession(params.id, updateData);
    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
