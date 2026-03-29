import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class FocusConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  keyword: string;

  @Column({ default: 5 })
  weight: number;

  @CreateDateColumn()
  createdAt: Date;
}