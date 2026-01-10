export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createNewSession } from '@/lib/auth/session';
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(req: NextRequest) {
  const bcrypt = require('bcryptjs');
  try {
    const { email, password } = loginSchema.parse(await req.json());
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user === undefined) return NextResponse.json({ error: 'Invalid' }, { status: 401 });
    const match = await bcrypt.compare(password, user.password);
    if (match === false) return NextResponse.json({ error: 'Invalid' }, { status: 401 });
    const session = await createNewSession(user.id);
    const res = NextResponse.json({ user: { id: user.id, email: user.email } });
    res.cookies.set('session', session, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 604800 });
    return res;
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}