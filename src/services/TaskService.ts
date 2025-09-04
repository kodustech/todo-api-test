import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  SortOption,
  PaginationOptions,
  PaginatedResponse,
  TaskStatus
} from '../models/Task';

// In-memory storage for MVP (would be replaced with database in production)
class InMemoryTaskStore {
  private tasks = new Map<string, Task>();
  private idempotencyStore = new Map<string, string>(); // idempotencyKey -> taskId

  create(task: Task): Task {
    this.tasks.set(task.id, task);
    return task;
  }

  findById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  findAll(): Task[] {
    return Array.from(this.tasks.values());
  }

  update(id: string, task: Task): Task {
    this.tasks.set(id, task);
    return task;
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }

  // Idempotency helpers
  getIdempotencyResult(key: string): string | undefined {
    return this.idempotencyStore.get(key);
  }

  setIdempotencyResult(key: string, taskId: string): void {
    this.idempotencyStore.set(key, taskId);
  }
}

export class TaskService {
  private store = new InMemoryTaskStore();

  // Seed some initial data for testing
  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const now = new Date().toISOString();

    const sampleTasks: Task[] = [
      {
        id: 'tsk_01HV7E2D1KXW3M2C3B4A5',
        listId: 'lst_01HV7E1Z9PABCDE',
        title: 'Revisar contrato',
        description: 'Checar cláusulas 3 e 5',
        status: 'open',
        priority: 'medium',
        dueAt: '2025-09-10T23:59:59-03:00',
        completedAt: null,
        assigneeIds: ['usr_01AB'],
        tags: ['jurídico', 'Q3'],
        checklist: [
          { id: 'chk_01', title: 'Cláusula 3', checked: true },
          { id: 'chk_02', title: 'Cláusula 5', checked: true }
        ],
        createdAt: now,
        updatedAt: now,
        version: 3
      }
    ];

    sampleTasks.forEach(task => this.store.create(task));
  }

  async createTask(input: CreateTaskInput, idempotencyKey?: string): Promise<Task> {
    // Check idempotency
    if (idempotencyKey) {
      const existingTaskId = this.store.getIdempotencyResult(idempotencyKey);
      if (existingTaskId) {
        const existingTask = this.store.findById(existingTaskId);
        if (existingTask) {
          return existingTask;
        }
      }
    }

    const now = new Date().toISOString();
    const taskId = `tsk_${uuidv4().replace(/-/g, '').toUpperCase()}`;

    const task: Task = {
      id: taskId,
      listId: input.listId,
      title: input.title,
      description: input.description,
      status: 'open',
      priority: input.priority || 'medium',
      dueAt: input.dueAt,
      completedAt: null,
      assigneeIds: input.assignees || [],
      tags: input.tags || [],
      checklist: (input.checklist || []).map((item, index) => ({
        id: `chk_${index.toString().padStart(2, '0')}`,
        title: item.title,
        checked: true // Default to checked as per spec
      })),
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    const createdTask = this.store.create(task);

    // Store idempotency result
    if (idempotencyKey) {
      this.store.setIdempotencyResult(idempotencyKey, taskId);
    }

    return createdTask;
  }

  async getTaskById(id: string): Promise<Task | null> {
    return this.store.findById(id) || null;
  }

  async getTasks(
    filters: TaskFilters = {},
    sort?: SortOption,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Task>> {
    let tasks = this.store.findAll();

    // Apply filters
    tasks = this.applyFilters(tasks, filters);

    // Apply sorting
    if (sort) {
      tasks = this.applySorting(tasks, sort);
    }

    // Apply pagination
    const paginatedResult = this.applyPagination(tasks, pagination);

    return paginatedResult;
  }

  async updateTask(id: string, input: UpdateTaskInput, expectedVersion?: number): Promise<Task> {
    const existingTask = this.store.findById(id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Check version for optimistic concurrency control
    if (expectedVersion !== undefined && existingTask.version !== expectedVersion) {
      throw new Error('Version conflict');
    }

    const now = new Date().toISOString();
    const updatedTask: Task = {
      ...existingTask,
      ...input,
      assigneeIds: input.assignees || existingTask.assigneeIds,
      tags: input.tags !== undefined ? input.tags : existingTask.tags,
      checklist: input.checklist !== undefined
        ? input.checklist.map((item, index) => ({
            id: 'id' in item ? item.id : `chk_${index.toString().padStart(2, '0')}`,
            title: item.title,
            checked: item.checked
          }))
        : existingTask.checklist,
      updatedAt: now,
      version: existingTask.version + 1
    };

    return this.store.update(id, updatedTask);
  }

  async completeTask(id: string): Promise<Task> {
    const existingTask = this.store.findById(id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    const now = new Date().toISOString();
    const updatedTask: Task = {
      ...existingTask,
      status: 'completed',
      completedAt: now,
      updatedAt: now,
      version: existingTask.version + 1
    };

    return this.store.update(id, updatedTask);
  }

  async reopenTask(id: string): Promise<Task> {
    const existingTask = this.store.findById(id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    const updatedTask: Task = {
      ...existingTask,
      status: 'open',
      completedAt: null,
      updatedAt: new Date().toISOString(),
      version: existingTask.version + 1
    };

    return this.store.update(id, updatedTask);
  }

  private applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter(task => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(task.status)) return false;
      }

      // List ID filter
      if (filters.listId && task.listId !== filters.listId) {
        return false;
      }

      // Assignee ID filter
      if (filters.assigneeId && !task.assigneeIds.includes(filters.assigneeId)) {
        return false;
      }

      // Tag filter
      if (filters.tag && !task.tags.includes(filters.tag)) {
        return false;
      }

      // Due date filters
      if (filters.dueAt) {
        if (filters.dueAt.gte && task.dueAt && task.dueAt < filters.dueAt.gte) {
          return false;
        }
        if (filters.dueAt.lte && task.dueAt && task.dueAt > filters.dueAt.lte) {
          return false;
        }
      }

      // Text search (prefix match on title)
      if (filters.q) {
        const query = filters.q.toLowerCase();
        if (!task.title.toLowerCase().startsWith(query)) {
          return false;
        }
      }

      return true;
    });
  }

  private applySorting(tasks: Task[], sort: SortOption): Task[] {
    return tasks.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      let comparison = 0;

      // Handle null/undefined values
      if (aValue == null && bValue == null) comparison = 0;
      else if (aValue == null) comparison = 1; // nulls sort last
      else if (bValue == null) comparison = -1; // nulls sort last
      else if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  private applyPagination(tasks: Task[], pagination?: PaginationOptions): PaginatedResponse<Task> {
    const limit = pagination?.limit || 50;
    const offset = 0; // Simplified pagination - would need cursor logic for production

    const paginatedTasks = tasks.slice(offset, offset + limit);

    // Simplified cursor logic (would be more complex in production)
    const hasNext = tasks.length > offset + limit;
    const hasPrev = offset > 0;

    return {
      data: paginatedTasks,
      links: {
        next: hasNext ? `cursor_${offset + limit}` : null,
        prev: hasPrev ? `cursor_${Math.max(0, offset - limit)}` : null
      }
    };
  }
}
