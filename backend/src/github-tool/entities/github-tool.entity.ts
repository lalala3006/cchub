import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { CollectionRecord } from './collection-record.entity';

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

  @Column({ nullable: true, length: 500 })
  avatarUrl: string;

  @Column({ nullable: true, type: 'text' })
  descriptionCn: string;

  @Column({ type: 'datetime' })
  fetchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => CollectionRecord, (record) => record.tool)
  collectionRecord: CollectionRecord[];
}