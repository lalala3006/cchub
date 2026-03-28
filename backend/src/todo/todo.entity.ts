import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TodoStatus = 'pending' | 'in_progress' | 'done';
export type TodoPriority = 'low' | 'medium' | 'high';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'pending' })
  status: TodoStatus;

  @Column({ default: 'medium' })
  priority: TodoPriority;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
