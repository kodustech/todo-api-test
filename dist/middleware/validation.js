"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskFiltersSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.updateChecklistItemSchema = exports.createChecklistItemSchema = exports.checklistItemSchema = exports.taskPrioritySchema = exports.taskStatusSchema = void 0;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateTaskId = validateTaskId;
exports.validateIdempotencyKey = validateIdempotencyKey;
const zod_1 = require("zod");
const Error_1 = require("../models/Error");
// Zod schemas for validation
exports.taskStatusSchema = zod_1.z.enum(['open', 'in_progress', 'completed', 'archived']);
exports.taskPrioritySchema = zod_1.z.enum(['low', 'medium', 'high', 'urgent']);
exports.checklistItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Checklist item title is required'),
    checked: zod_1.z.boolean().default(true)
});
// Schema for creating checklist items (without id and checked)
exports.createChecklistItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Checklist item title is required')
});
// Schema for updating checklist items (can have id or not)
exports.updateChecklistItemSchema = zod_1.z.union([
    exports.checklistItemSchema, // With id and checked
    zod_1.z.object({
        title: zod_1.z.string().min(1, 'Checklist item title is required'),
        checked: zod_1.z.boolean()
    }),
    zod_1.z.object({
        title: zod_1.z.string().min(1, 'Checklist item title is required')
    })
]);
exports.createTaskSchema = zod_1.z.object({
    listId: zod_1.z.string().min(1, 'listId is required'),
    title: zod_1.z.string().min(1, 'Title is required').max(240, 'Title must be 240 characters or less'),
    description: zod_1.z.string().optional(),
    priority: exports.taskPrioritySchema.default('medium'),
    dueAt: zod_1.z.string().optional(), // ISO-8601 validation would be more complex
    assignees: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    checklist: zod_1.z.array(exports.createChecklistItemSchema).optional()
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(240, 'Title must be 240 characters or less').optional(),
    description: zod_1.z.string().optional(),
    status: exports.taskStatusSchema.optional(),
    priority: exports.taskPrioritySchema.optional(),
    dueAt: zod_1.z.string().optional(),
    assignees: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    checklist: zod_1.z.array(exports.updateChecklistItemSchema).optional(),
    version: zod_1.z.number().int().optional()
});
// Query parameter schemas
exports.taskFiltersSchema = zod_1.z.object({
    'filter[status]': zod_1.z.string().optional(),
    'filter[listId]': zod_1.z.string().optional(),
    'filter[assigneeId]': zod_1.z.string().optional(),
    'filter[tag]': zod_1.z.string().optional(),
    'filter[dueAt][gte]': zod_1.z.string().optional(),
    'filter[dueAt][lte]': zod_1.z.string().optional(),
    'filter[q]': zod_1.z.string().optional(),
    sort: zod_1.z.string().optional(),
    'page[limit]': zod_1.z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    'page[after]': zod_1.z.string().optional(),
    'page[before]': zod_1.z.string().optional()
});
// Middleware function to validate request body
function validateBody(schema) {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const details = error.errors.map(err => ({
                    field: err.path.join('.'),
                    rule: err.code,
                    message: err.message
                }));
                res.status(422).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.VALIDATION_ERROR, 'Validation failed', details));
                return;
            }
            res.status(400).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.VALIDATION_ERROR, 'Invalid request data'));
        }
    };
}
// Middleware function to validate query parameters
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const validatedQuery = schema.parse(req.query);
            req.query = validatedQuery;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const details = error.errors.map(err => ({
                    field: `query.${err.path.join('.')}`,
                    rule: err.code,
                    message: err.message
                }));
                res.status(422).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.VALIDATION_ERROR, 'Invalid query parameters', details));
                return;
            }
            res.status(400).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.VALIDATION_ERROR, 'Invalid query parameters'));
        }
    };
}
// Validate UUID format for task ID
function validateTaskId(req, res, next) {
    const taskId = req.params.taskId;
    // Basic UUID format validation (simplified)
    const uuidRegex = /^tsk_[a-zA-Z0-9_-]+$/;
    if (!uuidRegex.test(taskId)) {
        res.status(400).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.VALIDATION_ERROR, 'Invalid task ID format'));
        return;
    }
    next();
}
// Validate idempotency key for POST requests
function validateIdempotencyKey(req, res, next) {
    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) {
        // Idempotency key is optional for POST
        next();
        return;
    }
    // Basic UUID v4 validation
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(idempotencyKey)) {
        res.status(400).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.VALIDATION_ERROR, 'Idempotency-Key must be a valid UUID v4'));
        return;
    }
    next();
}
//# sourceMappingURL=validation.js.map