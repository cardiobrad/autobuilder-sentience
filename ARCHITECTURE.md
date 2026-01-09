# 🔒 COMPREHENSIVE SECURITY ARCHITECTURE REDESIGN

## Executive Summary

You're right to be alarmed. These aren't just vulnerabilities—they're **architectural security failures**. Here's the complete secure architecture that fixes all 6 critical issues.

---

## 🏗️ SECURE ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Environment-based config (no secrets)                │ │
│  │  • CSP headers enforced                                 │ │
│  │  • Secure token storage (httpOnly cookies)              │ │
│  │  • Input sanitization before submission                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      CDN/WAF LAYER (Cloudflare)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • DDoS protection                                      │ │
│  │  • Rate limiting (Layer 7)                              │ │
│  │  • Bot detection                                        │ │
│  │  • Geographic restrictions                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Strict CORS policies                                 │ │
│  │  • Request validation                                   │ │
│  │  • API key verification                                 │ │
│  │  • Request/response transformation                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE CHAIN                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Rate Limiter (Redis-backed)                         │ │
│  │  2. Authentication Validator                            │ │
│  │  3. Authorization Checker                               │ │
│  │  4. Input Sanitizer                                     │ │
│  │  5. Request Logger                                      │ │
│  │  6. Error Handler                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Serverless functions (isolated)                      │ │
│  │  • Principle of least privilege                         │ │
│  │  • Secrets from vault only                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Encrypted at rest                                    │ │
│  │  • Encrypted in transit                                 │ │
│  │  • Row-level security                                   │ │
│  │  • Audit logging                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ ISSUE-BY-ISSUE FIXES

### **ISSUE #1: No Rate Limiting**

#### **Solution: Multi-Layer Rate Limiting**

```typescript
// /lib/security/rate-limiter.ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = Redis.fromEnv()

// Different rate limits for different operations
export const rateLimiters = {
  // Authentication attempts: 5 per 15 minutes per IP
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
  
  // API calls: 100 per minute per user
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),
  
  // Expensive operations: 10 per hour per user
  expensive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:expensive',
  }),
  
  // Anonymous users: 20 per hour per IP
  anonymous: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    analytics: true,
    prefix: 'ratelimit:anon',
  }),
}

// Middleware wrapper
export async function withRateLimit(
  identifier: string,
  limiter: keyof typeof rateLimiters,
  handler: () => Promise<Response>
): Promise<Response> {
  const { success, limit, reset, remaining } = await rateLimiters[limiter].limit(identifier)
  
  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }
  
  const response = await handler()
  
  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())
  
  return response
}
```

#### **Cloudflare WAF Rules** (Layer 7 DDoS Protection)

```javascript
// cloudflare-waf-rules.json
{
  "rules": [
    {
      "description": "Block excessive requests from single IP",
      "expression": "(http.request.uri.path contains \"/api/\") and (rate(1m) > 200)",
      "action": "challenge"
    },
    {
      "description": "Block login brute force",
      "expression": "(http.request.uri.path eq \"/api/auth/login\") and (rate(5m) > 10)",
      "action": "block"
    },
    {
      "description": "Block suspicious user agents",
      "expression": "(http.user_agent contains \"sqlmap\") or (http.user_agent contains \"nikto\")",
      "action": "block"
    }
  ]
}
```

---

### **ISSUE #2: No Input Validation/Sanitization**

#### **Solution: Comprehensive Validation Layer**

```typescript
// /lib/security/validation.ts
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Schema definitions for all inputs
export const schemas = {
  // User registration
  register: z.object({
    email: z.string().email().max(255).transform(val => validator.normalizeEmail(val) || val),
    password: z.string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
    name: z.string().min(1).max(100).transform(val => DOMPurify.sanitize(val)),
  }),
  
  // Login
  login: z.object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(255),
  }),
  
  // Project creation
  createProject: z.object({
    name: z.string().min(1).max(200).transform(val => DOMPurify.sanitize(val)),
    description: z.string().max(5000).optional().transform(val => 
      val ? DOMPurify.sanitize(val, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'] }) : val
    ),
    visibility: z.enum(['private', 'public', 'unlisted']),
  }),
  
  // File upload
  fileUpload: z.object({
    filename: z.string()
      .min(1)
      .max(255)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters')
      .refine(val => !val.includes('..'), 'Path traversal not allowed'),
    size: z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
    mimeType: z.enum([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ]),
  }),
  
  // API query parameters
  pagination: z.object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  
  // Search query
  search: z.object({
    q: z.string().min(1).max(200).transform(val => 
      validator.escape(DOMPurify.sanitize(val))
    ),
  }),
}

// Validation middleware
export function validateInput<T extends z.ZodType>(schema: T) {
  return async (data: unknown): Promise<z.infer<T>> => {
    try {
      return await schema.parseAsync(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid input', error.errors)
      }
      throw error
    }
  }
}

// Custom validation error
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError['errors']
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// SQL injection prevention (parameterized queries)
export function sanitizeForSQL(input: string): string {
  // This should NEVER be used - always use parameterized queries
  // Included only as last resort defense
  return input.replace(/['";\\]/g, '')
}

// XSS prevention for rich text
export function sanitizeHTML(html: string, allowedTags?: string[]): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags || ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

// Path traversal prevention
export function sanitizePath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\.\.+/g, '')
  if (normalized.includes('..') || normalized.startsWith('/')) {
    throw new ValidationError('Invalid path', [])
  }
  return normalized
}
```

#### **Server-Side Validation Middleware**

```typescript
// /lib/middleware/validate.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateInput, ValidationError } from '@/lib/security/validation'
import { z } from 'zod'

export function withValidation<T extends z.ZodType>(
  schema: T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (
    req: NextRequest,
    handler: (req: NextRequest, validated: z.infer<T>) => Promise<Response>
  ): Promise<Response> => {
    try {
      let data: unknown
      
      switch (source) {
        case 'body':
          data = await req.json()
          break
        case 'query':
          data = Object.fromEntries(req.nextUrl.searchParams)
          break
        case 'params':
          data = req.params
          break
      }
      
      const validated = await validateInput(schema)(data)
      return await handler(req, validated)
      
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }
  }
}
```

---

### **ISSUE #3: Broken Authentication**

#### **Solution: Secure Session Management**

```typescript
// /lib/auth/session.ts
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const REFRESH_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

interface SessionPayload {
  userId: string
  email: string
  role: string
  sessionId: string
  iat: number
  exp: number
}

interface RefreshPayload {
  userId: string
  sessionId: string
  tokenFamily: string
  iat: number
  exp: number
}

// Generate cryptographically secure session ID
function generateSessionId(): string {
  return randomBytes(32).toString('base64url')
}

// Generate token family for refresh token rotation
function generateTokenFamily(): string {
  return randomBytes(16).toString('base64url')
}

// Create access token (short-lived)
export async function createAccessToken(
  userId: string,
  email: string,
  role: string,
  sessionId: string
): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    role,
    sessionId,
  })
    .setProtectedHeader({ alg: 'HS256', typ: '