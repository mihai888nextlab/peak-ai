import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, writeFileSync } from 'fs';

const CREDENTIALS_FILE = '/tmp/strava-credentials.json';

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

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  // Return status of credentials
  if (action === 'status') {
    const creds = loadCredentials();
    return NextResponse.json({
      hasStravaCredentials: !!(creds.strava?.clientId && creds.strava?.clientSecret),
    });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, provider } = body;
    
    // Save credentials
    if (action === 'save_credentials') {
      const { clientId, clientSecret } = body;
      
      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Client ID and Secret required' }, { status: 400 });
      }
      
      const creds = loadCredentials();
      creds.strava = { clientId, clientSecret };
      writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
      
      return NextResponse.json({ success: true });
    }
    
    // Initiate OAuth with user credentials
    if (action === 'authorize' && provider === 'strava') {
      const creds = loadCredentials();
      
      if (!creds.strava?.clientId || !creds.strava?.clientSecret) {
        return NextResponse.json(
          { error: 'No Strava credentials configured. Add them in Settings first.' },
          { status: 400 }
        );
      }
      
      const clientId = creds.strava.clientId;
      const redirectUri = 'http://localhost:3000/api/strava/callback';
      const state = Math.random().toString(36).substring(7);
      
      // Build authorization URL
      const authUrl = new URL(STRAVA_AUTH_URL);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'activity:read_all,profile:read_all');
      authUrl.searchParams.set('state', state);
      
      return NextResponse.json({ 
        authorization_url: authUrl.toString(),
        state,
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
