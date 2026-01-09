import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db'; // Mock DB
import { schemas, validateInput } from '@/lib/security/validation';
import { createNewSession } from '@/lib/auth/session';
import { withRateLimit } from '@/lib/security/rate-limiter';

export async function POST(req: NextRequest) {
  const ipIdentifier = req.ip || 'anonymous';

  // Apply rate limiting to login attempts based on IP
  return withRateLimit(ipIdentifier, 'auth', async () => {
    try {
      const body = await req.json();
      const { email, password } = await validateInput(schemas.login, body);

      const user = await db.users.findByEmail(email);
      if (!user) {
        // Provide generic error message to prevent enumeration attacks
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      // Create and set session cookies upon successful login
      await createNewSession(user.id, user.email, user.role);

      return NextResponse.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      }, { status: 200 });

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ValidationError') {
          return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
        }
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Failed to log in', details: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  });
}
