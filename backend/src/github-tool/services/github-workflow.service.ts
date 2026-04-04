import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '../../common/exceptions/api-error';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { CollectionRecord, CollectionStatus } from '../entities/collection-record.entity';

const ALLOWED_TRANSITIONS: Record<CollectionStatus, CollectionStatus[]> = {
  [CollectionStatus.UNREAD]: [
    CollectionStatus.PRACTICED,
    CollectionStatus.DEEP_USE,
    CollectionStatus.NO_LONGER_USED,
  ],
  [CollectionStatus.PRACTICED]: [
    CollectionStatus.DEEP_USE,
    CollectionStatus.NO_LONGER_USED,
  ],
  [CollectionStatus.DEEP_USE]: [
    CollectionStatus.PRACTICED,
    CollectionStatus.NO_LONGER_USED,
  ],
  [CollectionStatus.NO_LONGER_USED]: [
    CollectionStatus.PRACTICED,
    CollectionStatus.DEEP_USE,
  ],
};

@Injectable()
export class GithubWorkflowService {
  constructor(
    @InjectRepository(CollectionRecord)
    private readonly recordRepo: Repository<CollectionRecord>,
  ) {}

  async keepTool(toolId: number): Promise<CollectionRecord> {
    const record = await this.findOrCreate(toolId, CollectionStatus.UNREAD);
    record.status = CollectionStatus.PRACTICED;
    record.isHidden = false;
    record.statusChangedAt = new Date();
    return this.recordRepo.save(record);
  }

  async hideTool(toolId: number): Promise<void> {
    const record = await this.findOrCreate(toolId, CollectionStatus.UNREAD);
    record.isHidden = true;
    record.statusChangedAt = new Date();
    await this.recordRepo.save(record);
  }

  async updateStatus(toolId: number, nextStatus: CollectionStatus): Promise<CollectionRecord> {
    const record = await this.recordRepo.findOne({ where: { toolId } });
    if (!record) {
      throw new ApiError(HttpStatus.NOT_FOUND, ErrorCodes.RESOURCE_NOT_FOUND, `Collection record for tool ${toolId} not found`);
    }

    if (record.status === nextStatus) {
      return record;
    }

    if (!ALLOWED_TRANSITIONS[record.status].includes(nextStatus)) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_STATE_TRANSITION,
        `Cannot move GitHub tool from ${record.status} to ${nextStatus}`,
      );
    }

    record.status = nextStatus;
    record.isHidden = false;
    record.statusChangedAt = new Date();
    return this.recordRepo.save(record);
  }

  private async findOrCreate(toolId: number, status: CollectionStatus) {
    const existing = await this.recordRepo.findOne({ where: { toolId } });
    if (existing) {
      return existing;
    }

    return this.recordRepo.create({
      toolId,
      status,
      isHidden: false,
      statusChangedAt: new Date(),
    });
  }
}
