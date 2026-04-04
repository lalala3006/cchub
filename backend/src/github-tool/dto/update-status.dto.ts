import { IsIn } from 'class-validator';
import { CollectionStatus } from '../entities/collection-record.entity';

export class UpdateStatusDto {
  @IsIn([
    CollectionStatus.PRACTICED,
    CollectionStatus.DEEP_USE,
    CollectionStatus.NO_LONGER_USED,
  ])
  status: CollectionStatus;
}
