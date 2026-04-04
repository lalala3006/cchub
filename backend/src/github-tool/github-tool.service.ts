import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan } from 'typeorm';
import { GithubTool } from './entities/github-tool.entity';
import { CollectionRecord, CollectionStatus } from './entities/collection-record.entity';
import { FocusConfig } from './entities/focus-config.entity';
import { CreateFocusConfigDto } from './dto/create-focus-config.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class GithubToolService {
  constructor(
    @InjectRepository(GithubTool) private toolRepo: Repository<GithubTool>,
    @InjectRepository(CollectionRecord) private recordRepo: Repository<CollectionRecord>,
    @InjectRepository(FocusConfig) private configRepo: Repository<FocusConfig>,
  ) {}

  // Feed: 本周推荐（去重、排除已隐藏）
  async getFeed(): Promise<GithubTool[]> {
    return this.toolRepo.createQueryBuilder('tool')
      .innerJoinAndSelect('tool.collectionRecord', 'record')
      .where('record.isHidden = :hidden', { hidden: false })
      .andWhere('record.status = :status', { status: CollectionStatus.UNREAD })
      .orderBy('tool.createdAt', 'DESC')
      .take(10)
      .getMany();
  }

  // 按状态查询收藏
  async getCollection(status?: CollectionStatus, search?: string): Promise<CollectionRecord[]> {
    const qb = this.recordRepo.createQueryBuilder('record')
      .leftJoinAndSelect('record.tool', 'tool')
      .where('record.isHidden = :hidden', { hidden: false });

    if (status) {
      qb.andWhere('record.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(tool.name LIKE :search OR tool.description LIKE :search)', { search: `%${search}%` });
    }

    // 清理超过半年的记录（除了 deep_use）
    await this.cleanupOldRecords();

    return qb.orderBy('record.statusChangedAt', 'DESC').getMany();
  }

  // 保留到收藏
  async keepTool(toolId: number): Promise<CollectionRecord> {
    let record = await this.recordRepo.findOne({ where: { toolId } });
    if (!record) {
      record = this.recordRepo.create({ toolId, status: CollectionStatus.UNREAD });
    }
    record.status = CollectionStatus.PRACTICED;
    record.statusChangedAt = new Date();
    return this.recordRepo.save(record);
  }

  // 隐藏
  async hideTool(toolId: number): Promise<void> {
    let record = await this.recordRepo.findOne({ where: { toolId } });
    if (!record) {
      record = this.recordRepo.create({ toolId });
    }
    record.isHidden = true;
    record.statusChangedAt = new Date();
    await this.recordRepo.save(record);
  }

  // 更新状态
  async updateStatus(toolId: number, dto: UpdateStatusDto): Promise<CollectionRecord> {
    const record = await this.recordRepo.findOne({ where: { toolId } });
    if (!record) {
      throw new NotFoundException(`Collection record for tool ${toolId} not found`);
    }
    record.status = dto.status;
    record.statusChangedAt = new Date();
    return this.recordRepo.save(record);
  }

  // 配置管理
  async getConfig(): Promise<FocusConfig[]> {
    return this.configRepo.find({ order: { weight: 'DESC' } });
  }

  async createConfig(dto: CreateFocusConfigDto): Promise<FocusConfig> {
    const config = this.configRepo.create(dto);
    return this.configRepo.save(config);
  }

  async deleteConfig(id: number): Promise<void> {
    await this.configRepo.delete(id);
  }

  async updateConfig(id: number, weight: number): Promise<FocusConfig> {
    await this.configRepo.update(id, { weight });
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Focus config ${id} not found`);
    }
    return config;
  }

  // 清理超过半年的记录
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
