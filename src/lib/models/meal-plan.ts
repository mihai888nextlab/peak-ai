import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export type MealTiming = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timing: MealTiming;
  eaten: boolean;
}

export interface MealPlan {
  _id: ObjectId;
  userId: string;
  date: string;
  meals: PlannedMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  goalType: 'bulk' | 'cut' | 'maintain';
  createdAt: Date;
  updatedAt: Date;
}

export async function getMealPlanCollection() {
  const db = await getDatabase();
  return db.collection<MealPlan>('meal_plans');
}

export async function getTodayMealPlan(userId: string): Promise<MealPlan | null> {
  const today = new Date().toISOString().split('T')[0];
  const collection = await getMealPlanCollection();
  return collection.findOne({ userId, date: today });
}

export async function getMealPlanByDate(userId: string, date: string): Promise<MealPlan | null> {
  const collection = await getMealPlanCollection();
  return collection.findOne({ userId, date });
}

export async function createMealPlan(
  userId: string,
  date: string,
  meals: Omit<PlannedMeal, 'id' | 'eaten'>[],
  goalType: 'bulk' | 'cut' | 'maintain'
): Promise<MealPlan> {
  const collection = await getMealPlanCollection();
  
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  const mealPlan: Omit<MealPlan, '_id'> = {
    userId,
    date,
    meals: meals.map((m, i) => ({
      ...m,
      id: `meal_${Date.now()}_${i}`,
      eaten: false,
    })),
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    goalType,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(mealPlan as MealPlan);
  return { ...mealPlan, _id: result.insertedId } as MealPlan;
}

export async function updateMealPlan(
  userId: string,
  date: string,
  meals: PlannedMeal[]
): Promise<MealPlan | null> {
  const collection = await getMealPlanCollection();
  
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  await collection.updateOne(
    { userId, date },
    {
      $set: {
        meals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        updatedAt: new Date(),
      },
    }
  );

  return collection.findOne({ userId, date });
}

export async function markMealEaten(
  userId: string,
  date: string,
  mealId: string,
  eaten: boolean
): Promise<MealPlan | null> {
  const collection = await getMealPlanCollection();
  const plan = await collection.findOne({ userId, date });
  
  if (!plan) return null;

  const meals = plan.meals.map(m => 
    m.id === mealId ? { ...m, eaten } : m
  );

  await collection.updateOne(
    { userId, date },
    { $set: { meals, updatedAt: new Date() } }
  );

  return collection.findOne({ userId, date });
}

export async function deleteMealPlan(userId: string, date: string): Promise<void> {
  const collection = await getMealPlanCollection();
  await collection.deleteOne({ userId, date });
}
