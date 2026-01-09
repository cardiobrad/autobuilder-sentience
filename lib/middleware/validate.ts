import { NextRequest, NextResponse } from 'next/server';
import { validateInput, ValidationError } from '@/lib/security/validation';
import { z } from 'zod';

type ParamType = { [key: string]: string | string[] | undefined };

// Helper to extract params from dynamic route segments
function getParamsFromRequest(req: NextRequest): ParamType {
  const urlParts = req.nextUrl.pathname.split('/');
  // Assuming dynamic segments are at the end, e.g., /api/projects/[id]
  // This is a simplified approach, a more robust solution might involve Next.js's `params` if directly available
  // For App Router, params are passed as an argument to route handlers, not directly on NextRequest.
  // So, this middleware would typically wrap the handler that already receives params.
  // For demonstration, we'll assume a pattern where ID is the last segment.
  const lastSegment = urlParts[urlParts.length - 1];
  if (lastSegment && lastSegment.match(/^[a-zA-Z0-9_-]+$/)) { // Basic check for an ID-like segment
    return { id: lastSegment };
  }
  return {};
}

export function withValidation<T extends z.ZodType>( // eslint-disable-line @typescript-eslint/no-explicit-any
  schema: T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (
    req: NextRequest,
    context: { params?: ParamType } | any, // Next.js API route handlers receive context with params
    handler: (req: NextRequest, validated: z.infer<T>, context?: { params?: ParamType }) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    try {
      let data: unknown;
      
      switch (source) {
        case 'body':
          // Ensure request body is not empty for 'body' source
          if (req.headers.get('content-type')?.includes('application/json')) {
            data = await req.json();
          } else {
            // Handle other body types if necessary, or throw error
            return NextResponse.json({ error: 'Invalid Content-Type for body validation. Expected application/json.' }, { status: 415 });
          }
          break;
        case 'query':
          data = Object.fromEntries(req.nextUrl.searchParams);
          break;
        case 'params':
          // For app router, params are in context.params
          data = context.params || getParamsFromRequest(req); // Fallback if context.params isn't directly passed via this middleware's structure
          break;
        default:
          data = {};
      }
      
      const validated = await validateInput(schema, data);
      return await handler(req, validated, context);
      
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({ path: err.path.join('.'), message: err.message })),
          },
          { status: 400 }
        );
      }
      console.error('Validation middleware error:', error);
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  };
}
