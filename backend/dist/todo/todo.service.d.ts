import { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
export declare class TodoService {
    private readonly todoRepository;
    constructor(todoRepository: Repository<Todo>);
    findAll(): Promise<Todo[]>;
    create(createTodoDto: CreateTodoDto): Promise<Todo>;
    findOne(id: number): Promise<Todo>;
    update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo>;
    remove(id: number): Promise<Todo>;
}
