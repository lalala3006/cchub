import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { TodoStatus, TodoPriority } from '../todo.entity';

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['pending', 'in_progress', 'done'])
  @IsOptional()
  status?: TodoStatus;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: TodoPriority;

  @IsNumber()
  @IsOptional()
  order?: number;
}
