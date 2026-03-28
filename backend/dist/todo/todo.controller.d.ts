import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
export declare class TodoController {
    private readonly todoService;
    constructor(todoService: TodoService);
    findAll(): Promise<import("./todo.entity").Todo[]>;
    create(createTodoDto: CreateTodoDto): Promise<import("./todo.entity").Todo>;
    findOne(id: number): Promise<import("./todo.entity").Todo>;
    update(id: number, updateTodoDto: UpdateTodoDto): Promise<import("./todo.entity").Todo>;
    remove(id: number): Promise<import("./todo.entity").Todo>;
}
