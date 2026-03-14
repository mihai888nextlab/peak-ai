import { NextRequest, NextResponse } from 'next/server';
import { getAllExercises, searchExercises, getExercises } from '@/lib/models/exercise-seed';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const muscle = searchParams.get('muscle') || '';

  try {
    let exercises;
    if (query || muscle) {
      exercises = await searchExercises(query, muscle || undefined);
    } else {
      exercises = await getAllExercises();
    }
    
    if (!exercises || exercises.length === 0) {
      exercises = await getExercises();
    }
    
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}
