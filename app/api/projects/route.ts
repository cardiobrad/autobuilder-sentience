import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/security/rate-limiter';
import { withValidation } from '@/lib/middleware/validate';
import { schemas } from '@/lib/security/validation';
import { db } from '@/lib/db'; // Mock DB

// GET /api/projects - List projects (authenticated)
export async function GET(req: NextRequest) {
  const ipIdentifier = req.ip || 'anonymous';

  return withRateLimit(ipIdentifier, 'api', async () => {
    return withAuth(async (req, currentUser) => {
      // Validate query parameters for pagination
      return withValidation(schemas.pagination, 'query')(req, {}, async (_, validatedQuery) => {
        const projects = await db.projects.list(currentUser.userId, validatedQuery);
        return NextResponse.json(projects);
      });
    })(req);
  });
}

// POST /api/projects - Create a new project (authenticated)
export async function POST(req: NextRequest) {
  const ipIdentifier = req.ip || 'anonymous';

  return withRateLimit(ipIdentifier, 'api', async () => {
    return withAuth(async (req, currentUser) => {
      // Validate request body for project creation
      return withValidation(schemas.createProject, 'body')(req, {}, async (_, validatedProjectData) => {
        const newProject = await db.projects.create({
          userId: currentUser.userId,
          ...validatedProjectData,
        });
        return NextResponse.json(newProject, { status: 201 });
      });
    })(req);
  });
}
