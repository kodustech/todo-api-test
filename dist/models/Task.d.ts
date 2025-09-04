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
    dueAt?: string;
    completedAt?: string | null;
    assigneeIds: string[];
    tags: string[];
    checklist: ChecklistItem[];
    createdAt: string;
    updatedAt: string;
    version: number;
}
export interface CreateTaskInput {
    listId: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueAt?: string;
    assignees?: string[];
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
    version?: number;
}
export interface PaginationLinks {
    next?: string | null;
    prev?: string | null;
}
export interface PaginatedResponse<T> {
    data: T[];
    links: PaginationLinks;
}
export interface TaskFilters {
    status?: TaskStatus[];
    listId?: string;
    assigneeId?: string;
    tag?: string;
    dueAt?: {
        gte?: string;
        lte?: string;
    };
    q?: string;
}
export type SortDirection = 'asc' | 'desc';
export interface SortOption {
    field: keyof Task;
    direction: SortDirection;
}
export interface PaginationOptions {
    limit?: number;
    after?: string;
    before?: string;
}
//# sourceMappingURL=Task.d.ts.map