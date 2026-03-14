import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getUserInjuries, 
  getActiveInjuries,
  createInjury, 
  updateInjury,
  markInjuryRecovered,
  deleteInjury 
} from '@/lib/models/injury';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const injuries = activeOnly 
      ? await getActiveInjuries(userId)
      : await getUserInjuries(userId);
    
    return NextResponse.json({ injuries });
  } catch (error) {
    console.error('Get injuries error:', error);
    return NextResponse.json({ error: 'Failed to get injuries' }, { status: 500 });
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
    const { action } = body;

    if (action === 'create') {
      const { name, bodyPart, description, severity, notes } = body;
      
      if (!name || !bodyPart) {
        return NextResponse.json({ error: 'Name and body part required' }, { status: 400 });
      }

      const injury = await createInjury(userId, { name, bodyPart, description, severity, notes });
      return NextResponse.json(injury);
    }

    if (action === 'update') {
      const { injuryId, ...updateData } = body;
      
      if (!injuryId) {
        return NextResponse.json({ error: 'Injury ID required' }, { status: 400 });
      }

      const injury = await updateInjury(injuryId, updateData);
      return NextResponse.json(injury);
    }

    if (action === 'recover') {
      const { injuryId, recoveryDate } = body;
      
      if (!injuryId) {
        return NextResponse.json({ error: 'Injury ID required' }, { status: 400 });
      }

      const injury = await markInjuryRecovered(
        injuryId, 
        recoveryDate || new Date().toISOString().split('T')[0]
      );
      return NextResponse.json(injury);
    }

    if (action === 'delete') {
      const { injuryId } = body;
      
      if (!injuryId) {
        return NextResponse.json({ error: 'Injury ID required' }, { status: 400 });
      }

      await deleteInjury(injuryId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Injury action error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
