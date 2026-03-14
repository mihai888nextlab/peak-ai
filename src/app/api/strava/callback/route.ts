import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, writeFileSync } from 'fs';

const CREDENTIALS_FILE = '/tmp/strava-credentials.json';
const TOKENS_FILE = '/tmp/strava-tokens.json';

interface Credentials {
  strava?: {
    clientId: string;
    clientSecret: string;
  };
}

interface Tokens {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
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

function loadTokens(): Tokens {
  try {
    if (existsSync(TOKENS_FILE)) {
      return JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load tokens:', e);
  }
  return {};
}

function saveTokens(tokens: Tokens) {
  writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  if (error) {
    return NextResponse.redirect(new URL('/app?device=error&message=' + encodeURIComponent(error), request.url));
  }
  
  if (!code) {
    return NextResponse.redirect(new URL('/app?device=error', request.url));
  }
  
  const creds = loadCredentials();
  
  if (!creds.strava?.clientId || !creds.strava?.clientSecret) {
    return NextResponse.redirect(new URL('/app?device=error&message=no_credentials', request.url));
  }
  
  try {
    // Exchange code for token
    const tokenResponse = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: creds.strava.clientId,
        client_secret: creds.strava.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Token exchange failed:', err);
      return NextResponse.redirect(new URL('/app?device=error&message=token_failed', request.url));
    }
    
    const tokens = await tokenResponse.json();
    saveTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
    });
    
    return NextResponse.redirect(new URL('/app?device=connected&provider=strava', request.url));
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/app?device=error', request.url));
  }
}
