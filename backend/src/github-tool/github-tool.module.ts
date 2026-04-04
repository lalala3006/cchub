import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { GithubToolController } from './github-tool.controller';
import { GithubToolService } from './github-tool.service';
import { GithubFetcherService } from './github-fetcher.service';
import { GithubTool } from './entities/github-tool.entity';
import { CollectionRecord } from './entities/collection-record.entity';
import { FocusConfig } from './entities/focus-config.entity';
import { LlmModule } from '../llm/llm.module';
import { GithubFeedService } from './services/github-feed.service';
import { GithubWorkflowService } from './services/github-workflow.service';
import { GithubConfigService } from './services/github-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GithubTool, CollectionRecord, FocusConfig]),
    ScheduleModule.forRoot(),
    LlmModule,
  ],
  controllers: [GithubToolController],
  providers: [
    GithubToolService,
    GithubFetcherService,
    GithubFeedService,
    GithubWorkflowService,
    GithubConfigService,
  ],
  exports: [GithubToolService, GithubFetcherService],
})
export class GithubToolModule {}
