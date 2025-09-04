"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TaskService_1 = require("../services/TaskService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const Error_1 = require("../models/Error");
const router = (0, express_1.Router)();
const taskService = new TaskService_1.TaskService();
// Helper function to parse query parameters
function parseQueryParams(query) {
    const filters = {};
    // Parse filter parameters
    if (query['filter[status]']) {
        filters.status = query['filter[status]'].split(',').map((s) => s.trim());
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
        if (query['filter[dueAt][gte]'])
            filters.dueAt.gte = query['filter[dueAt][gte]'];
        if (query['filter[dueAt][lte]'])
            filters.dueAt.lte = query['filter[dueAt][lte]'];
    }
    if (query['filter[q]']) {
        filters.q = query['filter[q]'];
    }
    // Parse sort parameter (only first field is applied per spec)
    let sort;
    if (query.sort) {
        const sortParam = query.sort.startsWith('-') ? query.sort.substring(1) : query.sort;
        const direction = query.sort.startsWith('-') ? 'desc' : 'asc';
        sort = { field: sortParam, direction };
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
function setETag(res, version) {
    res.set('ETag', `"${version}"`);
}
// Helper function to check If-Match header
function checkIfMatch(req, currentVersion) {
    const ifMatch = req.headers['if-match'];
    if (!ifMatch)
        return true; // No If-Match header means no version check
    // Remove quotes and 'v' prefix if present
    const expectedVersion = ifMatch.replace(/["v]/g, '');
    return parseInt(expectedVersion) === currentVersion;
}
// GET /v1/tasks - List tasks
router.get('/', auth_1.authenticate, (0, validation_1.validateQuery)(validation_1.taskFiltersSchema), async (req, res) => {
    try {
        const { filters, sort, pagination } = parseQueryParams(req.query);
        const result = await taskService.getTasks(filters, sort, pagination);
        res.json(result);
    }
    catch (error) {
        console.error('Error listing tasks:', error);
        res.status(500).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.INTERNAL_ERROR, 'Failed to list tasks', undefined, req.requestId));
    }
});
// POST /v1/tasks - Create task
router.post('/', auth_1.authenticate, (0, validation_1.validateBody)(validation_1.createTaskSchema), async (req, res) => {
    try {
        const task = await taskService.createTask(req.body, req.idempotencyKey);
        setETag(res, task.version);
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.INTERNAL_ERROR, 'Failed to create task', undefined, req.requestId));
    }
});
// GET /v1/tasks/{taskId} - Get single task
router.get('/:taskId', auth_1.authenticate, validation_1.validateTaskId, async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await taskService.getTaskById(taskId);
        if (!task) {
            res.status(404).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.NOT_FOUND, 'Task not found', undefined, req.requestId));
            return;
        }
        setETag(res, task.version);
        res.json(task);
    }
    catch (error) {
        console.error('Error getting task:', error);
        res.status(500).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.INTERNAL_ERROR, 'Failed to get task', undefined, req.requestId));
    }
});
// PATCH /v1/tasks/{taskId} - Update task
router.patch('/:taskId', auth_1.authenticate, validation_1.validateTaskId, (0, validation_1.validateBody)(validation_1.updateTaskSchema), async (req, res) => {
    try {
        const { taskId } = req.params;
        const existingTask = await taskService.getTaskById(taskId);
        if (!existingTask) {
            res.status(404).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.NOT_FOUND, 'Task not found', undefined, req.requestId));
            return;
        }
        // Check If-Match header or version in body
        const expectedVersion = req.body.version || (req.headers['if-match'] ?
            parseInt(req.headers['if-match'].replace(/["v]/g, '')) : undefined);
        if (expectedVersion !== undefined && existingTask.version !== expectedVersion) {
            res.status(409).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.CONFLICT, 'Version conflict - task has been modified', undefined, req.requestId));
            return;
        }
        // Remove version from update data as it's handled separately
        const { version, ...updateData } = req.body;
        const updatedTask = await taskService.updateTask(taskId, updateData, expectedVersion);
        setETag(res, updatedTask.version);
        res.json(updatedTask);
    }
    catch (error) {
        console.error('Error updating task:', error);
        if (error instanceof Error && error.message === 'Version conflict') {
            res.status(409).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.CONFLICT, 'Version conflict - task has been modified', undefined, req.requestId));
        }
        else {
            res.status(500).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.INTERNAL_ERROR, 'Failed to update task', undefined, req.requestId));
        }
    }
});
// POST /v1/tasks/{taskId}:complete - Complete task
router.post('/:taskId(\\w+):complete', auth_1.authenticate, validation_1.validateTaskId, async (req, res) => {
    try {
        const { taskId } = req.params;
        const existingTask = await taskService.getTaskById(taskId);
        if (!existingTask) {
            res.status(404).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.NOT_FOUND, 'Task not found', undefined, req.requestId));
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
    }
    catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.INTERNAL_ERROR, 'Failed to complete task', undefined, req.requestId));
    }
});
// POST /v1/tasks/{taskId}:reopen - Reopen task
router.post('/:taskId(\\w+):reopen', auth_1.authenticate, validation_1.validateTaskId, async (req, res) => {
    try {
        const { taskId } = req.params;
        const existingTask = await taskService.getTaskById(taskId);
        if (!existingTask) {
            res.status(404).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.NOT_FOUND, 'Task not found', undefined, req.requestId));
            return;
        }
        const updatedTask = await taskService.reopenTask(taskId);
        setETag(res, updatedTask.version);
        res.json(updatedTask);
    }
    catch (error) {
        console.error('Error reopening task:', error);
        res.status(500).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.INTERNAL_ERROR, 'Failed to reopen task', undefined, req.requestId));
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map