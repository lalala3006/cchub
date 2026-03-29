import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GithubTool } from './entities/github-tool.entity';
import { CollectionRecord } from './entities/collection-record.entity';
import { FocusConfig } from './entities/focus-config.entity';

interface GithubSearchItem {
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  language: string;
}

@Injectable()
export class GithubFetcherService {
  private readonly logger = new Logger(GithubFetcherService.name);

  constructor(
    @InjectRepository(GithubTool) private toolRepo: Repository<GithubTool>,
    @InjectRepository(CollectionRecord) private recordRepo: Repository<CollectionRecord>,
    @InjectRepository(FocusConfig) private configRepo: Repository<FocusConfig>,
  ) {}

  // 每周日凌晨 2 点执行
  @Cron('0 2 * * 0')
  async fetchWeekly() {
    this.logger.log('Starting weekly GitHub tools fetch...');
    try {
      await this.fetchAndSaveTools();
      this.logger.log('Weekly fetch completed');
    } catch (error) {
      this.logger.error('Weekly fetch failed', error);
    }
  }

  // 手动触发抓取
  async fetchAndSaveTools() {
    const configs = await this.configRepo.find({ order: { weight: 'DESC' } });
    if (configs.length === 0) {
      this.logger.warn('No focus configs found, skipping fetch');
      return;
    }

    // 计算总权重和配额分配
    const totalWeight = configs.reduce((sum, c) => sum + c.weight, 0);
    const tools: GithubTool[] = [];
    const existingFullNames = await this.getExistingFullNames();

    // 按权重分配抓取数量
    for (const config of configs) {
      const quota = Math.max(1, Math.round((config.weight / totalWeight) * 10));
      const fetched = await this.fetchByKeyword(config.keyword, quota, existingFullNames);
      tools.push(...fetched);
    }

    // 保存到数据库
    for (const tool of tools.slice(0, 10)) {
      await this.saveTool(tool);
    }
  }

  private async fetchByKeyword(keyword: string, limit: number, existing: Set<string>): Promise<GithubTool[]> {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&sort=stars&order=desc&per_page=${limit}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ccHub-GitHub-Tools' },
      });

      if (!response.ok) {
        this.logger.warn(`GitHub API error: ${response.status}`);
        return [];
      }

      const data = await response.json() as { items: GithubSearchItem[] };
      return data.items
        .filter(item => !existing.has(item.full_name))
        .map(item => this.mapToEntity(item));
    } catch (error) {
      this.logger.error(`Failed to fetch ${keyword}`, error);
      return [];
    }
  }

  private mapToEntity(item: GithubSearchItem): GithubTool {
    const tool = new GithubTool();
    const parts = item.full_name.split('/');
    tool.name = parts[1];
    tool.fullName = item.full_name;
    tool.url = item.html_url;
    tool.description = item.description;
    tool.stars = item.stargazers_count;
    tool.language = item.language;
    tool.fetchedAt = new Date();
    return tool;
  }

  private async fetchFavicon(owner: string, repo: string): Promise<string> {
    try {
      const url = `https://github.com/${owner}/${repo}`;
      const response = await fetch(url);
      const html = await response.text();

      // 匹配 <link rel="icon" href="..."> 或 <link rel="shortcut icon" href="...">
      const match = html.match(/<link\s+(?:rel="(?:icon|shortcut icon)"\s+)?href="([^"]+)"/i);
      if (match) {
        let favicon = match[1];
        if (favicon.startsWith('/')) {
          favicon = 'https://github.com' + favicon;
        }
        // 验证 URL 安全性
        if (this.isValidFaviconUrl(favicon)) {
          return favicon;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch favicon for ${owner}/${repo}:`, error);
    }
    // 默认返回 GitHub favicon
    return 'https://github.com/favicon.ico';
  }

  private isValidFaviconUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const validHosts = ['github.com', 'githubusercontent.com'];
      if (!validHosts.includes(parsed.hostname)) {
        return false;
      }
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  private async saveTool(tool: GithubTool): Promise<void> {
    const existing = await this.toolRepo.findOne({ where: { fullName: tool.fullName } });
    if (existing) return;

    // 抓取 favicon
    const parts = tool.fullName.split('/');
    tool.avatarUrl = await this.fetchFavicon(parts[0], parts[1]);

    const saved = await this.toolRepo.save(tool);

    // 创建收藏记录
    const record = new CollectionRecord();
    record.toolId = saved.id;
    record.status = 'unread' as any;
    record.isHidden = false;
    record.statusChangedAt = new Date();
    await this.recordRepo.save(record);
  }

  private async getExistingFullNames(): Promise<Set<string>> {
    const tools = await this.toolRepo.find();
    return new Set(tools.map(t => t.fullName));
  }
}