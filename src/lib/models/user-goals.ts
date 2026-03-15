import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export interface UserGoals {
  _id: ObjectId;
  userId: string;
  dailyCalorieGoal: number;
  goalType: 'maintain' | 'bulk' | 'cut';
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  waterGoal?: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserGoalsCollection() {
  const db = await getDatabase();
  return db.collection<UserGoals>('user_goals');
}

export async function getUserGoals(userId: string): Promise<UserGoals | null> {
  const collection = await getUserGoalsCollection();
  return collection.findOne({ userId });
}

export async function getOrCreateUserGoals(userId: string): Promise<UserGoals> {
  const collection = await getUserGoalsCollection();
  
  const existing = await collection.findOne({ userId });
  if (existing) {
    return existing;
  }
  
  const newGoals: Omit<UserGoals, '_id'> = {
    userId,
    dailyCalorieGoal: 2500,
    goalType: 'maintain',
    proteinGoal: 180,
    carbsGoal: 300,
    fatGoal: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await collection.insertOne(newGoals as any);
  return { ...newGoals, _id: result.insertedId } as UserGoals;
}

export async function updateUserGoals(
  userId: string, 
  data: Partial<Omit<UserGoals, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserGoals | null> {
  const collection = await getUserGoalsCollection();
  
  const existing = await collection.findOne({ userId });
  if (!existing) {
    const newGoals = await getOrCreateUserGoals(userId);
    return newGoals;
  }
  
  await collection.updateOne(
    { userId },
    { 
      $set: { 
        ...data,
        updatedAt: new Date() 
      } 
    }
  );
  
  return collection.findOne({ userId });
}
