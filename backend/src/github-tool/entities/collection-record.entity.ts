import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GithubTool } from './github-tool.entity';

export enum CollectionStatus {
  UNREAD = 'unread',
  PRACTICED = 'practiced',
  DEEP_USE = 'deep_use',
  NO_LONGER_USED = 'no_longer_used',
}

@Entity()
export class CollectionRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  toolId: number;

  @ManyToOne(() => GithubTool)
  @JoinColumn({ name: 'toolId' })
  tool: GithubTool;

  @Column({ type: 'text', default: CollectionStatus.UNREAD })
  status: CollectionStatus;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'datetime' })
  statusChangedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}