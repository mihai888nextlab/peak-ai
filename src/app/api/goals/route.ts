import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserGoals, getOrCreateUserGoals, updateUserGoals } from '@/lib/models/user-goals';

function calculateRecommendations(gender?: string, height?: number, weight?: number, goalType?: string) {
  if (!height || !weight) {
    return null;
  }

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * 30 + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * 30 - 161;
  }

  let tdee;
  switch (goalType) {
    case 'bulk':
      tdee = bmr * 1.2 * 1.15;
      break;
    case 'cut':
      tdee = bmr * 1.2 * 0.85;
      break;
    default:
      tdee = bmr * 1.2;
  }

  const proteinRatio = goalType === 'cut' ? 2.2 : goalType === 'bulk' ? 1.8 : 1.6;
  const protein = Math.round(weight * proteinRatio);
  
  const fat = Math.round((tdee * 0.25) / 9);
  
  const carbs = Math.round((tdee - (protein * 4) - (fat * 9)) / 4);

  const waterBase = weight * 35;
  const waterGoal = goalType === 'cut' ? Math.round(waterBase * 1.2) : waterBase;

  return {
    calories: Math.round(tdee),
    protein,
    carbs,
    fat,
    water: waterGoal,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const goals = await getOrCreateUserGoals(userId);

    const recommendations = calculateRecommendations(
      goals.gender,
      goals.height,
      goals.weight,
      goals.goalType
    );

    return NextResponse.json({ ...goals, recommendations });
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
    const { dailyCalorieGoal, goalType, proteinGoal, carbsGoal, fatGoal, gender, height, weight, waterGoal, applyRecommendations } = body;

    const currentGoals = await getUserGoals(userId);
    
    const updateData: any = {};
    if (dailyCalorieGoal !== undefined) updateData.dailyCalorieGoal = dailyCalorieGoal;
    if (goalType !== undefined) updateData.goalType = goalType;
    if (proteinGoal !== undefined) updateData.proteinGoal = proteinGoal;
    if (carbsGoal !== undefined) updateData.carbsGoal = carbsGoal;
    if (fatGoal !== undefined) updateData.fatGoal = fatGoal;
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (waterGoal !== undefined) updateData.waterGoal = waterGoal;

    const goalsToCheck = { ...currentGoals, ...updateData };
    const recommendations = calculateRecommendations(
      goalsToCheck.gender,
      goalsToCheck.height,
      goalsToCheck.weight,
      goalsToCheck.goalType
    );

    if (applyRecommendations && recommendations) {
      if (dailyCalorieGoal === undefined) updateData.dailyCalorieGoal = recommendations.calories;
      if (proteinGoal === undefined) updateData.proteinGoal = recommendations.protein;
      if (carbsGoal === undefined) updateData.carbsGoal = recommendations.carbs;
      if (fatGoal === undefined) updateData.fatGoal = recommendations.fat;
      if (waterGoal === undefined) updateData.waterGoal = recommendations.water;
    }

    const goals = await updateUserGoals(userId, updateData);
    return NextResponse.json({ ...goals, recommendations });
  } catch (error) {
    console.error('Update goals error:', error);
    return NextResponse.json({ error: 'Failed to update goals' }, { status: 500 });
  }
}
