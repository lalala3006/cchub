import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { GithubToolController } from './github-tool.controller';
import { GithubToolService } from './github-tool.service';
import { GithubFetcherService } from './github-fetcher.service';
import { GithubTool } from './entities/github-tool.entity';
import { CollectionRecord } from './entities/collection-record.entity';
import { FocusConfig } from './entities/focus-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GithubTool, CollectionRecord, FocusConfig]),
    ScheduleModule.forRoot(),
  ],
  controllers: [GithubToolController],
  providers: [GithubToolService, GithubFetcherService],
  exports: [GithubToolService],
})
export class GithubToolModule {}