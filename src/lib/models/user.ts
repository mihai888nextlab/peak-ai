import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
}

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  password?: string;
  image?: string;
  googleId?: string;
  openwearablesUserId?: string;
  plan: string;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection<User>('users');
}

export async function createUser(data: {
  email: string;
  name: string;
  password?: string;
  googleId?: string;
  image?: string;
}): Promise<User> {
  const collection = await getUsersCollection();
  
  const user: Omit<User, '_id'> = {
    email: data.email,
    name: data.name,
    password: data.password,
    googleId: data.googleId,
    image: data.image,
    plan: 'PEAK FREE',
    settings: {
      pushNotifications: true,
      emailNotifications: false,
      darkMode: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(user as User);
  return { ...user, _id: result.insertedId } as User;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ email: email.toLowerCase() });
}

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ googleId });
}

export async function findUserById(id: string): Promise<User | null> {
  const collection = await getUsersCollection();
  try {
    return collection.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { password: newPassword, updatedAt: new Date() } }
  );
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { ...settings, updatedAt: new Date() } }
  );
}

export async function updateUserOpenWearablesId(userId: string, openwearablesUserId: string): Promise<void> {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { openwearablesUserId, updatedAt: new Date() } }
  );
}
