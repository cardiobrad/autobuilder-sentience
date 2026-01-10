import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createNewSession } from '@/lib/auth/session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const bcrypt = require('bcryptjs');
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    const session = await createNewSession(user.id);
    const res = NextResponse.json({ user: { id: user.id, email: user.email } });
    res.cookies.set('session', session, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 604800 });
    return res;
  } catch (e) { return NextResponse.json({ error: 'Server Error' }, { status: 500 }); }
}