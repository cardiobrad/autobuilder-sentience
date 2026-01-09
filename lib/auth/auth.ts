import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, SessionPayload } from '@/lib/auth/session';
import { cookies } from 'next/headers';

// Helper to get current user session from cookies
export async function getCurrentUserSession(): Promise<SessionPayload | null> {
  const accessToken = cookies().get('access_token')?.value;
  if (!accessToken) {
    return null;
  }
  return verifyAccessToken(accessToken);
}

// Middleware wrapper for Next.js API Routes requiring authentication
export function withAuth(
  handler: (req: NextRequest, currentUser: SessionPayload, context?: any) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    context?: any
  ): Promise<NextResponse> => {
    const accessToken = req.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUser = await verifyAccessToken(accessToken);

    if (!currentUser) {
      // Access token might be expired or invalid. Middleware should handle refresh.
      // If it reaches here, it means refresh also failed or wasn't attempted.
      return NextResponse.json({ error: 'Authentication failed or expired' }, { status: 401 });
    }

    return handler(req, currentUser, context);
  };
}
