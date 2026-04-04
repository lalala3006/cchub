import { Injectable } from '@nestjs/common';
import { CreateFocusConfigDto } from './dto/create-focus-config.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CollectionStatus } from './entities/collection-record.entity';
import { GithubConfigService } from './services/github-config.service';
import { GithubFeedService } from './services/github-feed.service';
import { GithubWorkflowService } from './services/github-workflow.service';

@Injectable()
export class GithubToolService {
  constructor(
    private readonly feedService: GithubFeedService,
    private readonly workflowService: GithubWorkflowService,
    private readonly configService: GithubConfigService,
  ) {}

  getFeed() {
    return this.feedService.getFeed();
  }

  getCollection(status?: CollectionStatus, search?: string) {
    return this.feedService.getCollection(status, search);
  }

  keepTool(toolId: number) {
    return this.workflowService.keepTool(toolId);
  }

  hideTool(toolId: number) {
    return this.workflowService.hideTool(toolId);
  }

  updateStatus(toolId: number, dto: UpdateStatusDto) {
    return this.workflowService.updateStatus(toolId, dto.status);
  }

  getConfig() {
    return this.configService.getConfig();
  }

  createConfig(dto: CreateFocusConfigDto) {
    return this.configService.createConfig(dto);
  }

  deleteConfig(id: number) {
    return this.configService.deleteConfig(id);
  }

  updateConfig(id: number, weight: number) {
    return this.configService.updateConfig(id, weight);
  }
}
