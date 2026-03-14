import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // OpenWearables callback params
  const provider = searchParams.get('provider');
  const userId = searchParams.get('user_id');
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('OAuth callback:', { provider, userId, success, error, errorDescription });

  if (error || success === 'false') {
    const errorMsg = errorDescription || error || 'Authentication failed';
    return NextResponse.redirect(new URL('/app/devices?error=' + encodeURIComponent(errorMsg), request.url));
  }

  if (provider && (userId || success === 'true')) {
    return NextResponse.redirect(new URL('/app/devices?connected=' + provider, request.url));
  }

  return NextResponse.redirect(new URL('/app/devices?connected=success', request.url));
}
