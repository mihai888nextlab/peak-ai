import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
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
    
    // Get or create user
    let userId: string | null = null;
    
    const usersResponse = await fetch(`${API_URL}/api/v1/users?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Open-Wearables-API-Key': API_KEY || '',
      },
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      if (usersData.items && usersData.items.length > 0) {
        userId = usersData.items[0].id;
      }
    }
    
    if (!userId) {
      const createResponse = await fetch(`${API_URL}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Open-Wearables-API-Key': API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: 'PeakAI',
          last_name: 'User',
          email: 'peakai@local.dev',
        }),
      });
      
      if (createResponse.ok) {
        const userData = await createResponse.json();
        userId = userData.id;
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Could not get or create user' }, { status: 500 });
    }
    
    // Convert File to Buffer and create new FormData for the backend
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const backendFormData = new FormData();
    backendFormData.append('file', new Blob([buffer]), file.name);
    
    // Call the import endpoint
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
      return NextResponse.json(
        { error: errorData.detail || 'Import failed' },
        { status: importResponse.status }
      );
    }
    
    const data = await importResponse.json();
    return NextResponse.json({ success: true, message: 'Import successful', data });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed. Please try again.' },
      { status: 500 }
    );
  }
}
