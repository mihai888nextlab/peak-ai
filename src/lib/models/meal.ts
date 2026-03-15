import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export interface Meal {
  _id: ObjectId;
  userId: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  time: string;
  createdAt: Date;
  fromMealPlan?: string;
}

export async function getMealsCollection() {
  const db = await getDatabase();
  return db.collection<Meal>('meals');
}

export async function addMeal(data: {
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  fromMealPlan?: string | null;
}): Promise<Meal> {
  const collection = await getMealsCollection();
  
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const meal: Omit<Meal, '_id'> = {
    userId: data.userId,
    date: today,
    name: data.name,
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    servingSize: data.servingSize,
    time,
    createdAt: now,
    ...(data.fromMealPlan && { fromMealPlan: data.fromMealPlan }),
  };

  const result = await collection.insertOne(meal as Meal);
  return { ...meal, _id: result.insertedId } as Meal;
}

export async function getMealsByDate(userId: string, date: string): Promise<Meal[]> {
  const collection = await getMealsCollection();
  return collection.find({ userId, date }).sort({ createdAt: -1 }).toArray();
}

export async function getTodayMeals(userId: string): Promise<Meal[]> {
  const today = new Date().toISOString().split('T')[0];
  return getMealsByDate(userId, today);
}

export async function deleteMeal(mealId: string): Promise<void> {
  const collection = await getMealsCollection();
  await collection.deleteOne({ _id: new ObjectId(mealId) });
}

export async function getMealsByDateRange(userId: string, startDate: string, endDate: string): Promise<Meal[]> {
  const collection = await getMealsCollection();
  return collection
    .find({ userId, date: { $gte: startDate, $lte: endDate } })
    .sort({ date: -1, createdAt: -1 })
    .toArray();
}
