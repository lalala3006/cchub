import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { GithubToolService } from './github-tool.service';
import { GithubFetcherService } from './github-fetcher.service';
import { CreateFocusConfigDto } from './dto/create-focus-config.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CollectionStatus } from './entities/collection-record.entity';

@Controller('github-tools')
export class GithubToolController {
  constructor(
    private readonly service: GithubToolService,
    private readonly fetcher: GithubFetcherService,
  ) {}

  @Get('feed')
  getFeed() {
    return this.service.getFeed();
  }

  @Post('fetch')
  triggerFetch() {
    return this.fetcher.fetchAndSaveTools();
  }

  @Get('collection')
  getCollection(@Query('status') status?: CollectionStatus, @Query('search') search?: string) {
    return this.service.getCollection(status, search);
  }

  @Post('collection/:toolId/keep')
  keepTool(@Param('toolId', ParseIntPipe) toolId: number) {
    return this.service.keepTool(toolId);
  }

  @Post('collection/:toolId/hide')
  hideTool(@Param('toolId', ParseIntPipe) toolId: number) {
    return this.service.hideTool(toolId);
  }

  @Patch('collection/:toolId/status')
  updateStatus(@Param('toolId', ParseIntPipe) toolId: number, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(toolId, dto);
  }

  @Get('config')
  getConfig() {
    return this.service.getConfig();
  }

  @Post('config')
  createConfig(@Body() dto: CreateFocusConfigDto) {
    return this.service.createConfig(dto);
  }

  @Delete('config/:id')
  deleteConfig(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteConfig(id);
  }

  @Patch('config/:id')
  updateConfig(@Param('id', ParseIntPipe) id: number, @Body('weight') weight: number) {
    return this.service.updateConfig(id, weight);
  }
}