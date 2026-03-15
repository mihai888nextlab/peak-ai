import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export interface Exercise {
  _id: ObjectId;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  formCues: string[];
  instructions: string[];
  imageUrl?: string;
  videoUrl?: string;
  isCustom?: boolean;
  createdBy?: string;
}

export interface ExerciseInWorkout {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface CompletedSet {
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
  completedAt: Date;
  notes?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  exerciseName: string;
  sets: CompletedSet[];
}

export interface Workout {
  _id: ObjectId;
  userId: string;
  name: string;
  exercises: ExerciseInWorkout[];
  estimatedDuration: number;
  createdAt: Date;
  updatedAt: Date;
  lastCompletedAt?: Date;
  caloriesBurned?: number;
}

export interface WorkoutSession {
  _id: ObjectId;
  userId: string;
  workoutId?: string;
  workoutName?: string;
  startTime: Date;
  endTime?: Date;
  exercises: CompletedExercise[];
  status: 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export async function getExercisesCollection() {
  const db = await getDatabase();
  return db.collection<Exercise>('exercises');
}

export async function getWorkoutsCollection() {
  const db = await getDatabase();
  return db.collection<Workout>('workouts');
}

export async function getSessionsCollection() {
  const db = await getDatabase();
  return db.collection<WorkoutSession>('workout_sessions');
}

export async function getAllExercises(): Promise<Exercise[]> {
  const collection = await getExercisesCollection();
  return collection.find({}).toArray();
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const collection = await getExercisesCollection();
  try {
    return collection.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

export async function searchExercises(query: string, muscleGroup?: string): Promise<Exercise[]> {
  const collection = await getExercisesCollection();
  const filter: any = {};
  
  if (query) {
    filter.name = { $regex: query, $options: 'i' };
  }
  if (muscleGroup) {
    filter.muscleGroups = { $in: [new RegExp(muscleGroup, 'i')] };
  }
  
  return collection.find(filter).toArray();
}

export async function getUserWorkouts(userId: string, email?: string, date?: string | null): Promise<Workout[]> {
  const collection = await getWorkoutsCollection();
  
  const filter: any = email 
    ? { $or: [{ userId }, { userId: email }] }
    : { userId };

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }
  
  return collection.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const collection = await getWorkoutsCollection();
  try {
    return collection.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

export async function createWorkout(data: Omit<Workout, '_id' | 'createdAt' | 'updatedAt'>): Promise<Workout> {
  const collection = await getWorkoutsCollection();
  const workout = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await collection.insertOne(workout as any);
  return { ...workout, _id: result.insertedId } as Workout;
}

export async function updateWorkout(id: string, data: Partial<Workout>): Promise<Workout | null> {
  const collection = await getWorkoutsCollection();
  try {
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return getWorkoutById(id);
  } catch {
    return null;
  }
}

export async function deleteWorkout(id: string): Promise<boolean> {
  const collection = await getWorkoutsCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } catch {
    return false;
  }
}

export async function createSession(data: Omit<WorkoutSession, '_id'>): Promise<WorkoutSession> {
  const collection = await getSessionsCollection();
  const session = {
    ...data,
  };
  const result = await collection.insertOne(session as any);
  return { ...session, _id: result.insertedId } as WorkoutSession;
}

export async function getActiveSession(userId: string): Promise<WorkoutSession | null> {
  const collection = await getSessionsCollection();
  return collection.findOne({ userId, status: 'in_progress' });
}

export async function getSessionById(id: string): Promise<WorkoutSession | null> {
  const collection = await getSessionsCollection();
  try {
    return collection.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

export async function updateSession(id: string, data: Partial<WorkoutSession>): Promise<WorkoutSession | null> {
  const collection = await getSessionsCollection();
  try {
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
    return getSessionById(id);
  } catch {
    return null;
  }
}

export async function getUserSessions(userId: string, limit: number = 20): Promise<WorkoutSession[]> {
  const collection = await getSessionsCollection();
  return collection.find({ userId, status: 'completed' })
    .sort({ startTime: -1 })
    .limit(limit)
    .toArray();
}
