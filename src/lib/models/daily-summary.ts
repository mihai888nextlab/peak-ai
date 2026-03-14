import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export interface DailySummary {
  _id: ObjectId;
  userId: string;
  date: string;
  caloriesBurned: number;
  caloriesFromFood: number;
  steps: number;
  activeMinutes: number;
  workoutsCompleted: number;
  sleepHours?: number;
  sleepScore?: number;
  hrv?: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getDailySummaryCollection() {
  const db = await getDatabase();
  return db.collection<DailySummary>('daily_summaries');
}

export async function getOrCreateDailySummary(userId: string, date: string): Promise<DailySummary> {
  const collection = await getDailySummaryCollection();
  
  const existing = await collection.findOne({ userId, date });
  if (existing) {
    return existing;
  }
  
  const newSummary: Omit<DailySummary, '_id'> = {
    userId,
    date,
    caloriesBurned: 0,
    caloriesFromFood: 0,
    steps: 0,
    activeMinutes: 0,
    workoutsCompleted: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await collection.insertOne(newSummary as any);
  return { ...newSummary, _id: result.insertedId } as DailySummary;
}

export async function updateDailySummary(
  userId: string, 
  date: string, 
  data: Partial<Omit<DailySummary, '_id' | 'userId' | 'date' | 'createdAt' | 'updatedAt'>>
): Promise<DailySummary | null> {
  const collection = await getDailySummaryCollection();
  
  const existing = await collection.findOne({ userId, date });
  if (!existing) {
    const newSummary = await getOrCreateDailySummary(userId, date);
    return newSummary;
  }
  
  await collection.updateOne(
    { userId, date },
    { 
      $set: { 
        ...data,
        updatedAt: new Date() 
      } 
    }
  );
  
  return collection.findOne({ userId, date });
}

export async function addCaloriesBurned(userId: string, date: string, calories: number): Promise<void> {
  const collection = await getDailySummaryCollection();
  
  await collection.updateOne(
    { userId, date },
    { 
      $inc: { caloriesBurned: calories },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );
}

export async function getUserDailySummaries(userId: string, startDate: string, endDate: string): Promise<DailySummary[]> {
  const collection = await getDailySummaryCollection();
  return collection
    .find({ userId, date: { $gte: startDate, $lte: endDate } })
    .sort({ date: -1 })
    .toArray();
}

export async function getTodaySummary(userId: string): Promise<DailySummary | null> {
  const today = new Date().toISOString().split('T')[0];
  const collection = await getDailySummaryCollection();
  return collection.findOne({ userId, date: today });
}
