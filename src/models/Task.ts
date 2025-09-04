export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ChecklistItem {
  id: string;
  title: string;
  checked: boolean;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string; // ISO-8601 format
  completedAt?: string | null; // ISO-8601 format, null when not completed
  assigneeIds: string[]; // Output field
  tags: string[];
  checklist: ChecklistItem[];
  createdAt: string; // ISO-8601 format
  updatedAt: string; // ISO-8601 format
  version: number; // Integer, incremented on updates
}

// Input types for creating/updating tasks
export interface CreateTaskInput {
  listId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: string;
  assignees?: string[]; // Input field (maps to assigneeIds)
  tags?: string[];
  checklist?: Omit<ChecklistItem, 'id' | 'checked'>[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string;
  assignees?: string[];
  tags?: string[];
  checklist?: (Omit<ChecklistItem, 'id'> | ChecklistItem)[];
  version?: number; // For optimistic concurrency control
}

// Pagination types
export interface PaginationLinks {
  next?: string | null;
  prev?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
}

// Filter types
export interface TaskFilters {
  status?: TaskStatus[];
  listId?: string;
  assigneeId?: string;
  tag?: string;
  dueAt?: {
    gte?: string;
    lte?: string;
  };
  q?: string; // Prefix match on title
}

// Sort types
export type SortDirection = 'asc' | 'desc';
export interface SortOption {
  field: keyof Task;
  direction: SortDirection;
}

// Pagination options
export interface PaginationOptions {
  limit?: number;
  after?: string;
  before?: string;
}
