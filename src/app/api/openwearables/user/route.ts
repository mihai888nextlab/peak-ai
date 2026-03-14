import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateOpenWearablesUser, getUserConnections } from '@/lib/openwearables';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    const owUserId = await getOrCreateOpenWearablesUser(session.user.id);
    if (!owUserId) {
      return NextResponse.json({ error: 'Failed to get OpenWearables user' }, { status: 500 });
    }

    if (action === 'connections') {
      const connections = await getUserConnections(owUserId);
      return NextResponse.json({ owUserId, connections });
    }

    return NextResponse.json({ owUserId });
  } catch (error) {
    console.error('OpenWearables user error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
