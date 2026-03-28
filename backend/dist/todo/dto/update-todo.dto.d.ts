import { TodoStatus, TodoPriority } from '../todo.entity';
export declare class UpdateTodoDto {
    title?: string;
    description?: string;
    status?: TodoStatus;
    priority?: TodoPriority;
    order?: number;
}
