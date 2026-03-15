import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.OPENWEARABLES_API_URL || 'http://localhost:8000';
const API_KEY = process.env.OPENWEARABLES_API_KEY;

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=admin@admin.com&password=your-secure-password&grant_type=password',
  });
  
  if (!response.ok) {
    throw new Error('Failed to authenticate');
  }
  
  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

async function getOrCreateOpenWearablesUserByEmail(email: string): Promise<string | null> {
  const token = await getAuthToken();
  
  const searchRes = await fetch(`${API_URL}/api/v1/users?email=${encodeURIComponent(email)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Open-Wearables-API-Key': API_KEY || '',
    },
  });
  
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.items && searchData.items.length > 0) {
      console.log('[IMPORT] Found existing user:', searchData.items[0].id, searchData.items[0].email);
      return searchData.items[0].id;
    }
  }
  
  console.log('[IMPORT] User not found for email:', email);
  return null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[IMPORT] User email:', session.user.email);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const provider = request.nextUrl.searchParams.get('provider');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const token = await getAuthToken();
    
    const userId = await getOrCreateOpenWearablesUserByEmail(session.user.email);
    
    if (!userId) {
      console.error('[IMPORT] Could not find user for email:', session.user.email);
      return NextResponse.json({ error: 'Could not find user. Please reconnect.' }, { status: 500 });
    }
    
    console.log('[IMPORT] Using userId:', userId);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const backendFormData = new FormData();
    backendFormData.append('file', new Blob([buffer]), file.name);
    
    const importResponse = await fetch(
      `${API_URL}/api/v1/users/${userId}/import/apple/xml/direct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Open-Wearables-API-Key': API_KEY || '',
        },
        body: backendFormData,
      }
    );
    
    if (!importResponse.ok) {
      const errorData = await importResponse.json().catch(() => ({}));
      console.error('[IMPORT] Import failed:', errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Import failed' },
        { status: importResponse.status }
      );
    }
    
    const data = await importResponse.json();
    console.log('[IMPORT] Success:', data);
    return NextResponse.json({ success: true, message: 'Import successful', data, userId });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed. Please try again.' },
      { status: 500 }
    );
  }
}
