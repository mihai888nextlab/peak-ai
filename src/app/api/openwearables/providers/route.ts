import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateOpenWearablesUser } from '@/lib/openwearables';

const API_URL = process.env.OPENWEARABLES_API_URL || 'http://localhost:8001';
const API_KEY = process.env.OPENWEARABLES_API_KEY;

const authHeaders = {
  'X-Open-Wearables-API-Key': API_KEY || '',
};

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || 'api/v1/oauth/providers';
  
  try {
    const response = await fetch(`${API_URL}/${path}`, {
      headers: authHeaders,
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch providers' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'OpenWearables service unavailable. Make sure Docker is running.' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let owUserId: string | null = null;

    if (session?.user?.id) {
      owUserId = await getOrCreateOpenWearablesUser(session.user.id);
    }

    if (!owUserId) {
      const usersRes = await fetch(`${API_URL}/api/v1/users?limit=1`, {
        headers: authHeaders,
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.items && usersData.items.length > 0) {
          owUserId = usersData.items[0].id;
        }
      }
    }

    if (!owUserId) {
      return NextResponse.json({ error: 'Failed to get or create user' }, { status: 500 });
    }
    
    const oauthPath = `api/v1/oauth/${provider}/authorize?user_id=${owUserId}`;
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/openwearables/callback`;
    
    const oauthResponse = await fetch(`${API_URL}/${oauthPath}&redirect_uri=${encodeURIComponent(redirectUri)}`, {
      method: 'GET',
      headers: authHeaders,
    });
    
    if (!oauthResponse.ok) {
      const errorData = await oauthResponse.json().catch(() => ({}));
      const errorMsg = errorData.detail || errorData.message || 'Failed to initiate OAuth';
      
      if (errorMsg.includes('not configured') || errorMsg.includes('client_id') || errorMsg.includes('not set')) {
        return NextResponse.json({
          error: `OAuth credentials not configured for ${provider}`,
          details: 'The app administrator needs to add real API credentials to enable this provider.',
          provider
        }, { status: 400 });
      }
      
      return NextResponse.json(
        { error: errorMsg },
        { status: oauthResponse.status }
      );
    }
    
    const data = await oauthResponse.json();
    return NextResponse.json({ ...data, owUserId });
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
