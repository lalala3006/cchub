import { IsEnum } from 'class-validator';
import { CollectionStatus } from '../entities/collection-record.entity';

export class UpdateStatusDto {
  @IsEnum(CollectionStatus)
  status: CollectionStatus;
}