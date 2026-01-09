import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db'; // Mock DB
import { schemas, validateInput } from '@/lib/security/validation';
import { createNewSession } from '@/lib/auth/session';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';

const SALT_ROUNDS = 10;

export async function POST(req: NextRequest) {
  const ipIdentifier = req.ip || 'anonymous';

  // Apply rate limiting to registration attempts based on IP
  return withRateLimit(ipIdentifier, 'auth', async () => {
    try {
      const body = await req.json();
      const { email, password, name } = await validateInput(schemas.register, body);

      const existingUser = await db.users.findByEmail(email);
      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const newUser = await db.users.create({ email, passwordHash, name, role: 'user' });

      // Create and set session cookies immediately after successful registration
      await createNewSession(newUser.id, newUser.email, newUser.role);

      return NextResponse.json({
        message: 'Registration successful',
        user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      }, { status: 201 });

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ValidationError') {
          return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
        }
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Failed to register user', details: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  });
}
