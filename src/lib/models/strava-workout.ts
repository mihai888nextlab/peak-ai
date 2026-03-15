import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getDailySummaryCollection } from './daily-summary';
import { estimateCaloriesWithAI } from '@/lib/calories';

export interface StravaWorkout {
  _id: ObjectId;
  userId: string;
  stravaId: string;
  name: string;
  type: string;
  sportType: string;
  startDate: string;
  startDateLocal: string;
  timezone: string;
  duration: number;
  distance: number;
  elevation: number;
  calories: number;
  avgSpeed: number;
  maxSpeed: number;
  deviceName: string;
  estimatedCalories?: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getStravaWorkoutsCollection() {
  const db = await getDatabase();
  return db.collection<StravaWorkout>('strava_workouts');
}

export async function saveStravaWorkout(userId: string, workout: any): Promise<StravaWorkout | null> {
  const collection = await getStravaWorkoutsCollection();
  
  const existing = await collection.findOne({ stravaId: String(workout.id) });
  if (existing) {
    return existing;
  }

  const stravaWorkout: Omit<StravaWorkout, '_id'> = {
    userId,
    stravaId: String(workout.id),
    name: workout.name || 'Workout',
    type: workout.type || 'Activity',
    sportType: workout.sport_type || workout.type || 'Workout',
    startDate: workout.start_date || '',
    startDateLocal: workout.start_date_local || '',
    timezone: workout.timezone || '',
    duration: workout.moving_time || workout.elapsed_time || 0,
    distance: workout.distance || 0,
    elevation: workout.total_elevation_gain || 0,
    calories: workout.calories || 0,
    avgSpeed: workout.average_speed || 0,
    maxSpeed: workout.max_speed || 0,
    deviceName: workout.device_name || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(stravaWorkout as any);
  const savedWorkout = { ...stravaWorkout, _id: result.insertedId } as StravaWorkout;

  await syncWorkoutToDailySummary(savedWorkout);

  return savedWorkout;
}

export async function saveMultipleStravaWorkouts(userId: string, workouts: any[]): Promise<number> {
  let saved = 0;
  for (const workout of workouts) {
    const savedWorkout = await saveStravaWorkout(userId, workout);
    if (savedWorkout) saved++;
  }
  return saved;
}

export async function getUserStravaWorkouts(userId: string, limit: number = 20): Promise<StravaWorkout[]> {
  const collection = await getStravaWorkoutsCollection();
  return collection
    .find({ userId })
    .sort({ startDate: -1 })
    .limit(limit)
    .toArray();
}

export async function getStravaWorkoutsByDateRange(
  userId: string, 
  startDate: string, 
  endDate: string,
  limit: number = 100
): Promise<StravaWorkout[]> {
  const collection = await getStravaWorkoutsCollection();
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return collection
    .find({ 
      userId, 
      startDate: { $gte: start.toISOString(), $lte: end.toISOString() }
    })
    .sort({ startDate: -1 })
    .limit(limit)
    .toArray();
}

export async function updateWorkoutCalories(workoutId: string, estimatedCalories: number): Promise<void> {
  const collection = await getStravaWorkoutsCollection();
  
  let workout;
  try {
    workout = await collection.findOne({ _id: new ObjectId(workoutId) });
  } catch {
    workout = await collection.findOne({ stravaId: String(workoutId) });
  }
  
  await collection.updateOne(
    workout ? { _id: workout._id } : { stravaId: String(workoutId) },
    { $set: { estimatedCalories, updatedAt: new Date() } }
  );

  if (workout) {
    await syncWorkoutToDailySummary({ ...workout, estimatedCalories });
  }
}

async function syncWorkoutToDailySummary(workout: StravaWorkout) {
  if (!workout.startDate) return;
  
  const date = workout.startDate.split('T')[0];
  const summaryCollection = await getDailySummaryCollection();
  
  const existingSummary = await summaryCollection.findOne({ userId: workout.userId, date });
  
  const calories = workout.estimatedCalories || workout.calories || await estimateCaloriesWithAI(
    workout.duration,
    workout.distance,
    workout.elevation,
    workout.avgSpeed,
    workout.sportType
  );
  
  if (existingSummary) {
    await summaryCollection.updateOne(
      { userId: workout.userId, date },
      { 
        $inc: { caloriesBurned: calories, workoutsCompleted: 1 },
        $set: { updatedAt: new Date() }
      }
    );
  } else {
    await summaryCollection.insertOne({
      userId: workout.userId,
      date,
      caloriesBurned: calories,
      caloriesFromFood: 0,
      steps: 0,
      activeMinutes: Math.round(workout.duration / 60),
      workoutsCompleted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }
}
