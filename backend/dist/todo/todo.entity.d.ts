export type TodoStatus = 'pending' | 'in_progress' | 'done';
export type TodoPriority = 'low' | 'medium' | 'high';
export declare class Todo {
    id: number;
    title: string;
    description: string;
    status: TodoStatus;
    priority: TodoPriority;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}
