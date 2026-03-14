import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSession, getActiveSession, getSessionById, updateSession, getUserSessions } from '@/lib/models/workout';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const active = searchParams.get('active');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    if (active === 'true') {
      const activeSession = await getActiveSession(session.user.id);
      return NextResponse.json({ session: activeSession });
    }

    const sessions = await getUserSessions(session.user.id, limit);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { workoutId, workoutName, startTime } = body;

    const newSession = await createSession({
      userId: session.user.id,
      workoutId,
      workoutName,
      startTime: startTime ? new Date(startTime) : new Date(),
      exercises: [],
      status: 'in_progress',
    });

    return NextResponse.json({ session: newSession });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
