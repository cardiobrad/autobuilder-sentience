import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/security/rate-limiter';
import { withValidation } from '@/lib/middleware/validate';
import { schemas, ValidationError } from '@/lib/security/validation';
import { db } from '@/lib/db'; // Mock DB
import { z } from 'zod';

// Define a schema for the ID parameter itself
const idParamSchema = z.object({
  id: z.string().uuid('Invalid project ID format').min(1, 'Project ID is required'),
});

// GET /api/projects/[id] - Get a single project (authenticated)
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const ipIdentifier = req.ip || 'anonymous';

  return withRateLimit(ipIdentifier, 'api', async () => {
    return withAuth(async (req, currentUser) => {
      return withValidation(idParamSchema, 'params')(req, context, async (_, validatedParams) => {
        const { id } = validatedParams;
        const project = await db.projects.findById(id);

        if (!project || project.userId !== currentUser.userId) {
          return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }
        return NextResponse.json(project);
      });
    })(req, context); // Pass context to withAuth handler
  });
}

// PUT /api/projects/[id] - Update a project (authenticated)
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const ipIdentifier = req.ip || 'anonymous';

  return withRateLimit(ipIdentifier, 'api', async () => {
    return withAuth(async (req, currentUser) => {
      // Validate ID from params and body for project update
      const combinedSchema = idParamSchema.merge(schemas.createProject.partial()); // Allow partial updates
      return withValidation(combinedSchema, 'body')(req, context, async (_, validatedData) => {
        const { id, ...updates } = validatedData;

        const project = await db.projects.findById(id);
        if (!project || project.userId !== currentUser.userId) {
          return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }

        const updatedProject = await db.projects.update(id, updates);
        return NextResponse.json(updatedProject);
      });
    })(req, context);
  });
}

// DELETE /api/projects/[id] - Delete a project (authenticated)
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const ipIdentifier = req.ip || 'anonymous';

  return withRateLimit(ipIdentifier, 'api', async () => {
    return withAuth(async (req, currentUser) => {
      return withValidation(idParamSchema, 'params')(req, context, async (_, validatedParams) => {
        const { id } = validatedParams;

        const project = await db.projects.findById(id);
        if (!project || project.userId !== currentUser.userId) {
          return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
        }

        const deleted = await db.projects.delete(id);
        if (!deleted) {
          return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
      });
    })(req, context);
  });
}
