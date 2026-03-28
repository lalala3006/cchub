import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  findAll() {
    return this.todoRepository.find({ order: { order: 'ASC', createdAt: 'DESC' } });
  }

  create(createTodoDto: CreateTodoDto) {
    const todo = this.todoRepository.create(createTodoDto);
    return this.todoRepository.save(todo);
  }

  async findOne(id: number) {
    const todo = await this.todoRepository.findOne({ where: { id } });
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }
    return todo;
  }

  async update(id: number, updateTodoDto: UpdateTodoDto) {
    const todo = await this.findOne(id);
    Object.assign(todo, updateTodoDto);
    return this.todoRepository.save(todo);
  }

  async remove(id: number) {
    const todo = await this.findOne(id);
    return this.todoRepository.remove(todo);
  }
}
