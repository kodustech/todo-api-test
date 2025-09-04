import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, SortOption, PaginationOptions, PaginatedResponse } from '../models/Task';
export declare class TaskService {
    private store;
    constructor();
    private seedInitialData;
    createTask(input: CreateTaskInput, idempotencyKey?: string): Promise<Task>;
    getTaskById(id: string): Promise<Task | null>;
    getTasks(filters?: TaskFilters, sort?: SortOption, pagination?: PaginationOptions): Promise<PaginatedResponse<Task>>;
    updateTask(id: string, input: UpdateTaskInput, expectedVersion?: number): Promise<Task>;
    completeTask(id: string): Promise<Task>;
    reopenTask(id: string): Promise<Task>;
    private applyFilters;
    private applySorting;
    private applyPagination;
}
//# sourceMappingURL=TaskService.d.ts.map