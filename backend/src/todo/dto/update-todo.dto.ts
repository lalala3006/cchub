import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { TodoStatus, TodoPriority } from '../todo.entity';

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  title?: string;

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
