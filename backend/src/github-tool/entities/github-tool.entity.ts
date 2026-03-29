import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class GithubTool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  fullName: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  stars: number;

  @Column({ nullable: true })
  language: string;

  @Column({ type: 'datetime' })
  fetchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}