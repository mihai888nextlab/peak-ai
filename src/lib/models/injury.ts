import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export type InjuryStatus = 'active' | 'recovered' | 'chronic';

export interface Injury {
  _id: ObjectId;
  userId: string;
  name: string;
  bodyPart: string;
  description: string;
  status: InjuryStatus;
  severity: 'mild' | 'moderate' | 'severe';
  recoveryDate?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getInjuriesCollection() {
  const db = await getDatabase();
  return db.collection<Injury>('injuries');
}

export async function getUserInjuries(userId: string): Promise<Injury[]> {
  const collection = await getInjuriesCollection();
  return collection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function getActiveInjuries(userId: string): Promise<Injury[]> {
  const collection = await getInjuriesCollection();
  return collection.find({ 
    userId, 
    status: { $ne: 'recovered' }
  }).sort({ createdAt: -1 }).toArray();
}

export async function createInjury(
  userId: string,
  data: {
    name: string;
    bodyPart: string;
    description?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }
): Promise<Injury> {
  const collection = await getInjuriesCollection();
  
  const injury: Omit<Injury, '_id'> = {
    userId,
    name: data.name,
    bodyPart: data.bodyPart,
    description: data.description || '',
    status: 'active',
    severity: data.severity || 'moderate',
    notes: data.notes || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await collection.insertOne(injury as Injury);
  return { ...injury, _id: result.insertedId } as Injury;
}

export async function updateInjury(
  injuryId: string,
  data: Partial<{
    name: string;
    bodyPart: string;
    description: string;
    status: InjuryStatus;
    severity: 'mild' | 'moderate' | 'severe';
    recoveryDate?: string;
    notes: string;
  }>
): Promise<Injury | null> {
  const collection = await getInjuriesCollection();
  
  await collection.updateOne(
    { _id: new ObjectId(injuryId) },
    { $set: { ...data, updatedAt: new Date() } }
  );
  
  return collection.findOne({ _id: new ObjectId(injuryId) });
}

export async function markInjuryRecovered(
  injuryId: string,
  recoveryDate: string
): Promise<Injury | null> {
  const collection = await getInjuriesCollection();
  
  await collection.updateOne(
    { _id: new ObjectId(injuryId) },
    { 
      $set: { 
        status: 'recovered' as InjuryStatus,
        recoveryDate,
        updatedAt: new Date()
      }
    }
  );
  
  return collection.findOne({ _id: new ObjectId(injuryId) });
}

export async function deleteInjury(injuryId: string): Promise<void> {
  const collection = await getInjuriesCollection();
  await collection.deleteOne({ _id: new ObjectId(injuryId) });
}
