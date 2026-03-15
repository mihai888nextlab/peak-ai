import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Amount required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection('water_logs');
    
    const today = new Date().toISOString().split('T')[0];
    
    const existing = await collection.findOne({ userId, date: today });
    
    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        { $inc: { amount } }
      );
    } else {
      await collection.insertOne({
        userId,
        date: today,
        amount,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, amount });
  } catch (error) {
    console.error('Water log error:', error);
    return NextResponse.json({ error: 'Failed to log water' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const db = await getDatabase();
    const collection = db.collection('water_logs');
    
    const log = await collection.findOne({ userId, date });
    
    return NextResponse.json({ 
      amount: log?.amount || 0,
      date 
    });
  } catch (error) {
    console.error('Get water error:', error);
    return NextResponse.json({ error: 'Failed to get water' }, { status: 500 });
  }
}
