import { Router, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { authenticate } from '../middleware/auth';
import {
  validateBody,
  validateQuery,
  validateTaskId,
  createTaskSchema,
  updateTaskSchema,
  taskFiltersSchema
} from '../middleware/validation';
import { ApiRequest } from '../models/Api';
import { createErrorResponse, ERROR_CODES } from '../models/Error';
import { Task, TaskFilters, SortOption } from '../models/Task';

const router = Router();
const taskService = new TaskService();

// Helper function to parse query parameters
function parseQueryParams(query: any): { filters: TaskFilters; sort?: SortOption; pagination: any } {
  const filters: TaskFilters = {};

  // Parse filter parameters
  if (query['filter[status]']) {
    filters.status = query['filter[status]'].split(',').map((s: string) => s.trim());
  }
  if (query['filter[listId]']) {
    filters.listId = query['filter[listId]'];
  }
  if (query['filter[assigneeId]']) {
    filters.assigneeId = query['filter[assigneeId]'];
  }
  if (query['filter[tag]']) {
    filters.tag = query['filter[tag]'];
  }
  if (query['filter[dueAt][gte]'] || query['filter[dueAt][lte]']) {
    filters.dueAt = {};
    if (query['filter[dueAt][gte]']) filters.dueAt.gte = query['filter[dueAt][gte]'];
    if (query['filter[dueAt][lte]']) filters.dueAt.lte = query['filter[dueAt][lte]'];
  }
  if (query['filter[q]']) {
    filters.q = query['filter[q]'];
  }

  // Parse sort parameter (only first field is applied per spec)
  let sort: SortOption | undefined;
  if (query.sort) {
    const sortParam = query.sort.startsWith('-') ? query.sort.substring(1) : query.sort;
    const direction = query.sort.startsWith('-') ? 'desc' : 'asc';
    sort = { field: sortParam as keyof Task, direction };
  }

  // Parse pagination
  const pagination = {
    limit: query['page[limit]'] || 50,
    after: query['page[after]'],
    before: query['page[before]']
  };

  return { filters, sort, pagination };
}

// Helper function to set ETag header
function setETag(res: Response, version: number): void {
  res.set('ETag', `"${version}"`);
}

// Helper function to check If-Match header
function checkIfMatch(req: ApiRequest, currentVersion: number): boolean {
  const ifMatch = req.headers['if-match'];
  if (!ifMatch) return true; // No If-Match header means no version check

  // Remove quotes and 'v' prefix if present
  const expectedVersion = ifMatch.replace(/["v]/g, '');
  return parseInt(expectedVersion) === currentVersion;
}

// GET /v1/tasks - List tasks
router.get('/', authenticate, validateQuery(taskFiltersSchema), async (req: ApiRequest, res) => {
  try {
    const { filters, sort, pagination } = parseQueryParams(req.query);

    const result = await taskService.getTasks(filters, sort, pagination);

    res.json(result);
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to list tasks',
      undefined,
      req.requestId
    ));
  }
});

// POST /v1/tasks - Create task
router.post('/', authenticate, validateBody(createTaskSchema), async (req: ApiRequest, res) => {
  try {
    const task = await taskService.createTask(req.body, req.idempotencyKey);

    setETag(res, task.version);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to create task',
      undefined,
      req.requestId
    ));
  }
});

// GET /v1/tasks/{taskId} - Get single task
router.get('/:taskId', authenticate, validateTaskId, async (req: ApiRequest, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTaskById(taskId);

    if (!task) {
      res.status(404).json(createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Task not found',
        undefined,
        req.requestId
      ));
      return;
    }

    setETag(res, task.version);
    res.json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to get task',
      undefined,
      req.requestId
    ));
  }
});

// PATCH /v1/tasks/{taskId} - Update task
router.patch('/:taskId', authenticate, validateTaskId, validateBody(updateTaskSchema), async (req: ApiRequest, res) => {
  try {
    const { taskId } = req.params;
    const existingTask = await taskService.getTaskById(taskId);

    if (!existingTask) {
      res.status(404).json(createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Task not found',
        undefined,
        req.requestId
      ));
      return;
    }

    // Check If-Match header or version in body
    const expectedVersion = req.body.version || (req.headers['if-match'] ?
      parseInt(req.headers['if-match'].replace(/["v]/g, '')) : undefined);

    if (expectedVersion !== undefined && existingTask.version !== expectedVersion) {
      res.status(409).json(createErrorResponse(
        ERROR_CODES.CONFLICT,
        'Version conflict - task has been modified',
        undefined,
        req.requestId
      ));
      return;
    }

    // Remove version from update data as it's handled separately
    const { version, ...updateData } = req.body;

    const updatedTask = await taskService.updateTask(taskId, updateData, expectedVersion);

    setETag(res, updatedTask.version);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error instanceof Error && error.message === 'Version conflict') {
      res.status(409).json(createErrorResponse(
        ERROR_CODES.CONFLICT,
        'Version conflict - task has been modified',
        undefined,
        req.requestId
      ));
    } else {
      res.status(500).json(createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update task',
        undefined,
        req.requestId
      ));
    }
  }
});

// POST /v1/tasks/{taskId}:complete - Complete task
router.post('/:taskId(\\w+):complete', authenticate, validateTaskId, async (req: ApiRequest, res) => {
  try {
    const { taskId } = req.params;
    const existingTask = await taskService.getTaskById(taskId);

    if (!existingTask) {
      res.status(404).json(createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Task not found',
        undefined,
        req.requestId
      ));
      return;
    }

    const updatedTask = await taskService.completeTask(taskId);

    setETag(res, updatedTask.version);
    res.json({
      id: updatedTask.id,
      status: updatedTask.status,
      completedAt: updatedTask.completedAt,
      version: updatedTask.version
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to complete task',
      undefined,
      req.requestId
    ));
  }
});

// POST /v1/tasks/{taskId}:reopen - Reopen task
router.post('/:taskId(\\w+):reopen', authenticate, validateTaskId, async (req: ApiRequest, res) => {
  try {
    const { taskId } = req.params;
    const existingTask = await taskService.getTaskById(taskId);

    if (!existingTask) {
      res.status(404).json(createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Task not found',
        undefined,
        req.requestId
      ));
      return;
    }

    const updatedTask = await taskService.reopenTask(taskId);

    setETag(res, updatedTask.version);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error reopening task:', error);
    res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to reopen task',
      undefined,
      req.requestId
    ));
  }
});

export default router;
