import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/auth/session';
import { withAuth } from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/security/rate-limiter';

export async function POST(req: NextRequest) {
  const ipIdentifier = req.ip || 'anonymous';

  // Even logout can be subject to rate limiting to prevent resource exhaustion attacks
  return withRateLimit(ipIdentifier, 'api', async () => {
    // Although `withAuth` will run first, `clearSessionCookies` should work irrespective of token validity
    return withAuth(async (req, currentUser) => {
      console.log(`User ${currentUser.userId} logging out. Invalidating session ${currentUser.sessionId}`);
      clearSessionCookies(); // Invalidate on client side
      // In a real app, you'd also invalidate the session ID in your database if tracking server-side.

      return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    })(req);
  });
}
