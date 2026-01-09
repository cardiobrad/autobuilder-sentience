import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';
import { type CookieOptions } from 'next/dist/server/web/spec-extension/cookies';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Please generate a strong, random 32-byte (256-bit) string.');
}

const ACCESS_TOKEN_EXPIRATION_SECONDS = 1 * 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string; // Unique per session
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  sessionId: string; // Corresponds to the session ID in access token
  tokenFamily: string; // For refresh token rotation
}

// Generate cryptographically secure session ID
function generateSessionId(): string {
  return randomBytes(32).toString('base64url'); // 256-bit entropy
}

// Generate token family for refresh token rotation
function generateTokenFamily(): string {
  return randomBytes(16).toString('base64url'); // 128-bit entropy
}

// Hash the refresh token before storing in DB (or comparing)
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Create access token (short-lived)
export async function createAccessToken(
  userId: string,
  email: string,
  role: string,
  sessionId: string
): Promise<{ token: string; expires: Date }> {
  const expires = new Date(Date.now() + ACCESS_TOKEN_EXPIRATION_SECONDS * 1000);
  const token = await new SignJWT({
    userId,
    email,
    role,
    sessionId,
  } as SessionPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(JWT_SECRET);
  return { token, expires };
}

// Create refresh token (long-lived, for rotation)
export async function createRefreshToken(
  userId: string,
  sessionId: string,
  tokenFamily: string
): Promise<{ token: string; expires: Date }> {
  const expires = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_SECONDS * 1000);
  const token = await new SignJWT({
    userId,
    sessionId,
    tokenFamily,
  } as RefreshTokenPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(JWT_SECRET);
  return { token, expires };
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    // Ensure all required fields are present
    if (typeof payload.userId === 'string' && typeof payload.email === 'string' && typeof payload.role === 'string' && typeof payload.sessionId === 'string') {
      return payload as SessionPayload;
    }
    return null;
  } catch (error) {
    console.error('Access token verification failed:', (error as Error).message);
    return null;
  }
}

// Verify refresh token
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload.userId === 'string' && typeof payload.sessionId === 'string' && typeof payload.tokenFamily === 'string') {
      return payload as RefreshTokenPayload;
    }
    return null;
  } catch (error) {
    console.error('Refresh token verification failed:', (error as Error).message);
    return null;
  }
}

// Set session cookies
export function setSessionCookies(
  accessToken: string, expAccessToken: Date,
  refreshToken: string, expRefreshToken: Date
) {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Protects against CSRF
    path: '/',
  };
  cookies().set('access_token', accessToken, { ...cookieOptions, expires: expAccessToken });
  cookies().set('refresh_token', refreshToken, { ...cookieOptions, expires: expRefreshToken });
}

// Clear session cookies
export function clearSessionCookies() {
  cookies().delete('access_token');
  cookies().delete('refresh_token');
}

// Create a new session (login/registration)
export async function createNewSession(
  userId: string,
  email: string,
  role: string
): Promise<SessionPayload> {
  const sessionId = generateSessionId();
  const tokenFamily = generateTokenFamily();

  // In a real application, store `sessionId`, `tokenFamily`, and `hashedRefreshToken` in your database
  // related to the userId. This allows for refresh token rotation and revocation.
  // For this example, we're simulating without a full DB interaction here.
  console.log(`
    [DB SIMULATION]: Storing new session for user ${userId}:
    Session ID: ${sessionId}
    Token Family: ${tokenFamily}
    (Hashed Refresh Token would be stored here)
  `);

  const { token: accessToken, expires: expAccessToken } = await createAccessToken(userId, email, role, sessionId);
  const { token: refreshToken, expires: expRefreshToken } = await createRefreshToken(userId, sessionId, tokenFamily);

  setSessionCookies(accessToken, expAccessToken, refreshToken, expRefreshToken);

  return { userId, email, role, sessionId, iat: Math.floor(Date.now() / 1000), exp: Math.floor(expAccessToken.getTime() / 1000) };
}

// Refresh an existing session
export async function refreshAccessToken(oldRefreshToken: string): Promise<{ newAccessToken: string; newRefreshToken: string; session: SessionPayload } | null> {
  const decodedRefresh = await verifyRefreshToken(oldRefreshToken);

  if (!decodedRefresh) {
    console.warn('Invalid or expired refresh token.');
    return null;
  }

  // In a real application:
  // 1. Look up the session in your database using `decodedRefresh.sessionId` and `decodedRefresh.tokenFamily`.
  // 2. Compare `hashToken(oldRefreshToken)` with the stored hashed refresh token.
  // 3. If match, generate a new `tokenFamily` and `newRefreshToken`.
  // 4. Invalidate the old refresh token (mark as used/delete from DB).
  // 5. Store the new `tokenFamily` and `hashedNewRefreshToken`.
  // 6. If no match or session revoked, return null.
  console.log(`
    [DB SIMULATION]: Refreshing session for user ${decodedRefresh.userId}.
    Old Refresh Token Family: ${decodedRefresh.tokenFamily}
    (Verification against stored hashed refresh token would happen here)
  `);

  // Simulate successful DB lookup and token rotation
  const newSessionId = decodedRefresh.sessionId; // Session ID remains the same
  const newUserId = decodedRefresh.userId;
  const newEmail = 'simulated@example.com'; // In real app, fetch from DB
  const newRole = 'user'; // In real app, fetch from DB
  const newTokenFamily = generateTokenFamily(); // Rotate token family

  const { token: newAccessToken, expires: expAccessToken } = await createAccessToken(newUserId, newEmail, newRole, newSessionId);
  const { token: newRefreshToken, expires: expRefreshToken } = await createRefreshToken(newUserId, newSessionId, newTokenFamily);

  setSessionCookies(newAccessToken, expAccessToken, newRefreshToken, expRefreshToken);

  return {
    newAccessToken,
    newRefreshToken,
    session: { userId: newUserId, email: newEmail, role: newRole, sessionId: newSessionId, iat: Math.floor(Date.now() / 1000), exp: Math.floor(expAccessToken.getTime() / 1000) },
  };
}

// Invalidate a specific session (logout)
export async function invalidateSession(sessionId: string) {
  // In a real application, delete the session record (or mark as invalid) from your database.
  console.log(`[DB SIMULATION]: Invalidating session ${sessionId} for logout.`);
  clearSessionCookies();
}
