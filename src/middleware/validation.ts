import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createErrorResponse, ERROR_CODES } from '../models/Error';

// Zod schemas for validation
export const taskStatusSchema = z.enum(['open', 'in_progress', 'completed', 'archived']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const checklistItemSchema = z.object({
  title: z.string().min(1, 'Checklist item title is required'),
  checked: z.boolean().default(true)
});

// Schema for creating checklist items (without id and checked)
export const createChecklistItemSchema = z.object({
  title: z.string().min(1, 'Checklist item title is required')
});

// Schema for updating checklist items (can have id or not)
export const updateChecklistItemSchema = z.union([
  checklistItemSchema, // With id and checked
  z.object({ // Without id, with checked
    title: z.string().min(1, 'Checklist item title is required'),
    checked: z.boolean()
  }),
  z.object({ // Without id and checked
    title: z.string().min(1, 'Checklist item title is required')
  })
]);

export const createTaskSchema = z.object({
  listId: z.string().min(1, 'listId is required'),
  title: z.string().min(1, 'Title is required').max(240, 'Title must be 240 characters or less'),
  description: z.string().optional(),
  priority: taskPrioritySchema.default('medium'),
  dueAt: z.string().optional(), // ISO-8601 validation would be more complex
  assignees: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  checklist: z.array(createChecklistItemSchema).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(240, 'Title must be 240 characters or less').optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueAt: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  checklist: z.array(updateChecklistItemSchema).optional(),
  version: z.number().int().optional()
});

// Query parameter schemas
export const taskFiltersSchema = z.object({
  'filter[status]': z.string().optional(),
  'filter[listId]': z.string().optional(),
  'filter[assigneeId]': z.string().optional(),
  'filter[tag]': z.string().optional(),
  'filter[dueAt][gte]': z.string().optional(),
  'filter[dueAt][lte]': z.string().optional(),
  'filter[q]': z.string().optional(),
  sort: z.string().optional(),
  'page[limit]': z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  'page[after]': z.string().optional(),
  'page[before]': z.string().optional()
});

// Middleware function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          rule: err.code,
          message: err.message
        }));

        res.status(422).json(createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Validation failed',
          details
        ));
        return;
      }

      res.status(400).json(createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request data'
      ));
    }
  };
}

// Middleware function to validate query parameters
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: `query.${err.path.join('.')}`,
          rule: err.code,
          message: err.message
        }));

        res.status(422).json(createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Invalid query parameters',
          details
        ));
        return;
      }

      res.status(400).json(createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid query parameters'
      ));
    }
  };
}

// Validate UUID format for task ID
export function validateTaskId(req: Request, res: Response, next: NextFunction): void {
  const taskId = req.params.taskId;

  // Basic UUID format validation (simplified)
  const uuidRegex = /^tsk_[a-zA-Z0-9_-]+$/;
  if (!uuidRegex.test(taskId)) {
    res.status(400).json(createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid task ID format'
    ));
    return;
  }

  next();
}

// Validate idempotency key for POST requests
export function validateIdempotencyKey(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    // Idempotency key is optional for POST
    next();
    return;
  }

  // Basic UUID v4 validation
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV4Regex.test(idempotencyKey)) {
    res.status(400).json(createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'Idempotency-Key must be a valid UUID v4'
    ));
    return;
  }

  next();
}
