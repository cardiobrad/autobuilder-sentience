import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/security/rate-limiter';
import { withValidation } from '@/lib/middleware/validate';
import { schemas, sanitizePath } from '@/lib/security/validation';

// Mock storage for demonstration purposes
const mockFileStorage: { [key: string]: { filename: string; mimeType: string; size: number; content: string } } = {};

export async function POST(req: NextRequest) {
  const ipIdentifier = req.ip || 'anonymous';

  return withRateLimit(ipIdentifier, 'expensive', async () => { // File uploads can be expensive
    return withAuth(async (req, currentUser) => {
      // Due to complexities of handling FormData directly with `withValidation` for 'body',
      // we'll parse the FormData and then validate its parts manually.
      const formData = await req.formData();

      const file = formData.get('file') as File | null;
      const filename = formData.get('filename') as string | null;
      const mimeType = formData.get('mimeType') as string | null;

      if (!file || !filename || !mimeType) {
        return NextResponse.json({ error: 'Missing file, filename, or mimeType' }, { status: 400 });
      }

      try {
        // Validate file metadata using the schema
        const validatedMetadata = await schemas.fileUpload.parseAsync({
          filename: filename,
          size: file.size,
          mimeType: mimeType,
        });

        // Further sanitize filename for storage path if needed, preventing path traversal
        const safeFilename = sanitizePath(validatedMetadata.filename);

        // Simulate saving the file
        const fileContent = await file.text(); // For text files, otherwise use arrayBuffer()
        const fileId = `${currentUser.userId}-${Date.now()}-${safeFilename}`;
        mockFileStorage[fileId] = { ...validatedMetadata, content: fileContent };

        console.log(`File ${safeFilename} uploaded by ${currentUser.userId}. Size: ${file.size} bytes.`);

        return NextResponse.json({
          message: 'File uploaded successfully',
          fileId: fileId,
          filename: safeFilename,
          size: file.size,
          mimeType: file.type,
        }, { status: 201 });
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'ZodError') {
            return NextResponse.json({ error: 'File validation failed', details: (error as any).errors }, { status: 400 });
          }
          return NextResponse.json({ error: 'Failed to upload file', details: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred during file upload' }, { status: 500 });
      }
    })(req);
  });
}
