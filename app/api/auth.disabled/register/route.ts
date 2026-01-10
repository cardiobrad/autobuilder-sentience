export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createNewSession } from '@/lib/auth/session';
const regSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) });
export async function POST(req: NextRequest) {
  const bcrypt = require('bcryptjs');
  try {
    const { email, password, name } = regSchema.parse(await req.json());
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email', [email, hashed, name]);
    const session = await createNewSession(result.rows[0].id);
    const res = NextResponse.json({ user: result.rows[0] });
    res.cookies.set('session', session, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 604800 });
    return res;
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}