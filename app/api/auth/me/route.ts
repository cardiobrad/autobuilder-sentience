import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/security/rate-limiter';
import { db } from '@/lib/db'; // Mock DB

export async function GET(req: NextRequest) {
  const ipIdentifier = req.ip || 'anonymous';

  return withRateLimit(ipIdentifier, 'api', async () => {
    return withAuth(async (req, currentUser) => {
      // In a real app, fetch fresh user data from DB using currentUser.userId
      const user = await db.users.findById(currentUser.userId);

      if (!user) {
        // This case should ideally not happen if authentication is robust and DB is in sync
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        // Do NOT return passwordHash or other sensitive data
      });
    })(req);
  });
}
