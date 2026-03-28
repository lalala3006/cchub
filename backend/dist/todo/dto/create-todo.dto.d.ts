import { TodoStatus, TodoPriority } from '../todo.entity';
export declare class CreateTodoDto {
    title: string;
    description?: string;
    status?: TodoStatus;
    priority?: TodoPriority;
    order?: number;
}
