import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Custom validation error
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError['errors']
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Schema definitions for all inputs
export const schemas = {
  // User registration
  register: z.object({
    email: z.string().email('Invalid email address').max(255).transform(val => validator.normalizeEmail(val) || val),
    password: z.string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').transform(val => DOMPurify.sanitize(val)),
  }),
  
  // Login
  login: z.object({
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(1, 'Password is required').max(255),
  }),
  
  // Project creation/update
  createProject: z.object({
    name: z.string().min(1, 'Project name is required').max(200, 'Project name too long').transform(val => DOMPurify.sanitize(val)),
    description: z.string().max(5000, 'Description too long').optional().transform(val => 
      val ? DOMPurify.sanitize(val, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'] }) : val
    ),
    visibility: z.enum(['private', 'public', 'unlisted'], { message: 'Invalid visibility option' }),
  }),
  
  // File upload metadata
  fileUpload: z.object({
    filename: z.string()
      .min(1, 'Filename is required')
      .max(255, 'Filename too long')
      .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters')
      .refine(val => !val.includes('..'), 'Path traversal not allowed in filename'),
    size: z.number().int().positive('File size must be positive').max(10 * 1024 * 1024, 'File too large (max 10MB)'), // Max 10MB
    mimeType: z.enum([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ], { message: 'Unsupported file type' }),
    // Actual file content handling would be separate, after metadata validation.
  }),
  
  // API query parameters for pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').max(1000, 'Page number too high').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  }).partial(), // Allow partial query parameters
  
  // Search query
  search: z.object({
    q: z.string().min(1, 'Search query cannot be empty').max(200, 'Search query too long').transform(val => 
      validator.escape(DOMPurify.sanitize(val)) // Escape HTML for storage/display
    ),
  }),
};

// Generic validation function
export async function validateInput<T extends z.ZodType>(schema: T, data: unknown): Promise<z.infer<T>> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input', error.errors);
    }
    throw error;
  }
}

// SQL injection prevention (parameterized queries are the primary defense)
// This function should NEVER be used for direct query construction.
// Included only as a theoretical last resort defense if dynamic query parts are absolutely unavoidable (which they shouldn't be).
export function sanitizeForSQL(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Remove or neutralize common SQL injection characters.
  // This is a highly imperfect defense and prone to bypasses.
  return input.replace(/['";\`\[\](){}<>@#$%^&*!~=\-+?,./|]/g, '');
}

// XSS prevention for rich text content being displayed
export function sanitizeHTML(html: string, allowedTags?: string[]): string {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags || ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'], // Be very careful with 'style' and 'class'
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  });
}

// Path traversal prevention
export function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string') throw new ValidationError('Invalid path', []);
  // Replace backslashes with forward slashes for consistency
  const normalized = path.replace(/\\/g, '/');
  // Remove any '/../' or '../' sequences
  const noTraversal = normalized.split('/').filter(segment => segment !== '..' && segment !== '').join('/');
  // Ensure it doesn't start with a slash if it's meant to be relative
  const finalPath = noTraversal.startsWith('/') ? noTraversal.substring(1) : noTraversal;
  
  if (finalPath.includes('..')) { // Double check after filtering
    throw new ValidationError('Invalid path: path traversal detected', []);
  }
  return finalPath;
}
