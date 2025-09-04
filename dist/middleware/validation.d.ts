import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const taskStatusSchema: z.ZodEnum<["open", "in_progress", "completed", "archived"]>;
export declare const taskPrioritySchema: z.ZodEnum<["low", "medium", "high", "urgent"]>;
export declare const checklistItemSchema: z.ZodObject<{
    title: z.ZodString;
    checked: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    checked: boolean;
    title: string;
}, {
    title: string;
    checked?: boolean | undefined;
}>;
export declare const createChecklistItemSchema: z.ZodObject<{
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
}, {
    title: string;
}>;
export declare const updateChecklistItemSchema: z.ZodUnion<[z.ZodObject<{
    title: z.ZodString;
    checked: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    checked: boolean;
    title: string;
}, {
    title: string;
    checked?: boolean | undefined;
}>, z.ZodObject<{
    title: z.ZodString;
    checked: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    checked: boolean;
    title: string;
}, {
    checked: boolean;
    title: string;
}>, z.ZodObject<{
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
}, {
    title: string;
}>]>;
export declare const createTaskSchema: z.ZodObject<{
    listId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    dueAt: z.ZodOptional<z.ZodString>;
    assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    checklist: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
    }, {
        title: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    listId: string;
    priority: "low" | "medium" | "high" | "urgent";
    description?: string | undefined;
    dueAt?: string | undefined;
    tags?: string[] | undefined;
    checklist?: {
        title: string;
    }[] | undefined;
    assignees?: string[] | undefined;
}, {
    title: string;
    listId: string;
    description?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    dueAt?: string | undefined;
    tags?: string[] | undefined;
    checklist?: {
        title: string;
    }[] | undefined;
    assignees?: string[] | undefined;
}>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["open", "in_progress", "completed", "archived"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    dueAt: z.ZodOptional<z.ZodString>;
    assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    checklist: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
        title: z.ZodString;
        checked: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        checked: boolean;
        title: string;
    }, {
        title: string;
        checked?: boolean | undefined;
    }>, z.ZodObject<{
        title: z.ZodString;
        checked: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        checked: boolean;
        title: string;
    }, {
        checked: boolean;
        title: string;
    }>, z.ZodObject<{
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
    }, {
        title: string;
    }>]>, "many">>;
    version: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    status?: "open" | "in_progress" | "completed" | "archived" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    dueAt?: string | undefined;
    tags?: string[] | undefined;
    checklist?: ({
        checked: boolean;
        title: string;
    } | {
        checked: boolean;
        title: string;
    } | {
        title: string;
    })[] | undefined;
    version?: number | undefined;
    assignees?: string[] | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    status?: "open" | "in_progress" | "completed" | "archived" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    dueAt?: string | undefined;
    tags?: string[] | undefined;
    checklist?: ({
        title: string;
        checked?: boolean | undefined;
    } | {
        checked: boolean;
        title: string;
    } | {
        title: string;
    })[] | undefined;
    version?: number | undefined;
    assignees?: string[] | undefined;
}>;
export declare const taskFiltersSchema: z.ZodObject<{
    'filter[status]': z.ZodOptional<z.ZodString>;
    'filter[listId]': z.ZodOptional<z.ZodString>;
    'filter[assigneeId]': z.ZodOptional<z.ZodString>;
    'filter[tag]': z.ZodOptional<z.ZodString>;
    'filter[dueAt][gte]': z.ZodOptional<z.ZodString>;
    'filter[dueAt][lte]': z.ZodOptional<z.ZodString>;
    'filter[q]': z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodString>;
    'page[limit]': z.ZodOptional<z.ZodEffects<z.ZodString, number | undefined, string>>;
    'page[after]': z.ZodOptional<z.ZodString>;
    'page[before]': z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sort?: string | undefined;
    'filter[status]'?: string | undefined;
    'filter[listId]'?: string | undefined;
    'filter[assigneeId]'?: string | undefined;
    'filter[tag]'?: string | undefined;
    'filter[dueAt][gte]'?: string | undefined;
    'filter[dueAt][lte]'?: string | undefined;
    'filter[q]'?: string | undefined;
    'page[limit]'?: number | undefined;
    'page[after]'?: string | undefined;
    'page[before]'?: string | undefined;
}, {
    sort?: string | undefined;
    'filter[status]'?: string | undefined;
    'filter[listId]'?: string | undefined;
    'filter[assigneeId]'?: string | undefined;
    'filter[tag]'?: string | undefined;
    'filter[dueAt][gte]'?: string | undefined;
    'filter[dueAt][lte]'?: string | undefined;
    'filter[q]'?: string | undefined;
    'page[limit]'?: string | undefined;
    'page[after]'?: string | undefined;
    'page[before]'?: string | undefined;
}>;
export declare function validateBody<T>(schema: z.ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateQuery(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateTaskId(req: Request, res: Response, next: NextFunction): void;
export declare function validateIdempotencyKey(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=validation.d.ts.map