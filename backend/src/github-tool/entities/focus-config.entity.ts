import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class FocusConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  keyword: string;

  @Column({ default: 5 })
  weight: number = 5;

  @CreateDateColumn()
  createdAt: Date;

  constructor() {
    this.weight = 5;
  }
}