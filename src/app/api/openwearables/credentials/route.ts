import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CREDENTIALS_FILE = '/tmp/openwearables-credentials.json';

interface Credentials {
  strava?: {
    clientId: string;
    clientSecret: string;
  };
}

function loadCredentials(): Credentials {
  try {
    if (existsSync(CREDENTIALS_FILE)) {
      return JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load credentials:', e);
  }
  return {};
}

function saveCredentials(creds: Credentials) {
  try {
    writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
  } catch (e) {
    console.error('Failed to save credentials:', e);
  }
}

export async function GET() {
  const creds = loadCredentials();
  
  // Don't return secrets
  const safe = {
    strava: creds.strava ? { hasCredentials: !!creds.strava.clientId } : undefined,
  };
  
  return NextResponse.json(safe);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret, provider } = body;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    const creds = loadCredentials();
    
    if (provider === 'strava' || !provider) {
      creds.strava = { clientId, clientSecret };
    }
    
    saveCredentials(creds);
    
    return NextResponse.json({ success: true, message: 'Credentials saved' });
  } catch (error) {
    console.error('Failed to save credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}
