import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { GithubTool } from '../entities/github-tool.entity';
import { CollectionRecord, CollectionStatus } from '../entities/collection-record.entity';

@Injectable()
export class GithubFeedService {
  constructor(
    @InjectRepository(GithubTool) private readonly toolRepo: Repository<GithubTool>,
    @InjectRepository(CollectionRecord) private readonly recordRepo: Repository<CollectionRecord>,
  ) {}

  async getFeed(): Promise<GithubTool[]> {
    return this.toolRepo.createQueryBuilder('tool')
      .innerJoinAndSelect('tool.collectionRecord', 'record')
      .where('record.isHidden = :hidden', { hidden: false })
      .andWhere('record.status = :status', { status: CollectionStatus.UNREAD })
      .orderBy('tool.createdAt', 'DESC')
      .take(10)
      .getMany();
  }

  async getCollection(status?: CollectionStatus, search?: string): Promise<CollectionRecord[]> {
    await this.cleanupOldRecords();

    const qb = this.recordRepo.createQueryBuilder('record')
      .leftJoinAndSelect('record.tool', 'tool')
      .where('record.isHidden = :hidden', { hidden: false });

    if (status) {
      qb.andWhere('record.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(tool.name LIKE :search OR tool.description LIKE :search)', { search: `%${search}%` });
    }

    return qb.orderBy('record.statusChangedAt', 'DESC').getMany();
  }

  private async cleanupOldRecords(): Promise<void> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    await this.recordRepo.delete({
      status: Not(CollectionStatus.DEEP_USE),
      statusChangedAt: LessThan(sixMonthsAgo),
      isHidden: false,
    });
  }
}
