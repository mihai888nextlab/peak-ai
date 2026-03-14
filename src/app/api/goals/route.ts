import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserGoals, getOrCreateUserGoals, updateUserGoals } from '@/lib/models/user-goals';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const goals = await getOrCreateUserGoals(userId);

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    return NextResponse.json({ error: 'Failed to get goals' }, { status: 500 });
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
    const { dailyCalorieGoal, goalType, proteinGoal, carbsGoal, fatGoal } = body;

    const updateData: any = {};
    if (dailyCalorieGoal !== undefined) updateData.dailyCalorieGoal = dailyCalorieGoal;
    if (goalType !== undefined) updateData.goalType = goalType;
    if (proteinGoal !== undefined) updateData.proteinGoal = proteinGoal;
    if (carbsGoal !== undefined) updateData.carbsGoal = carbsGoal;
    if (fatGoal !== undefined) updateData.fatGoal = fatGoal;

    const goals = await updateUserGoals(userId, updateData);
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Update goals error:', error);
    return NextResponse.json({ error: 'Failed to update goals' }, { status: 500 });
  }
}
