import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GithubTool } from '../entities/github-tool.entity';
import { CollectionRecord, CollectionStatus } from '../entities/collection-record.entity';
import { FocusConfig } from '../entities/focus-config.entity';

interface GithubSearchItem {
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  language: string;
}

interface GithubReadmeResponse {
  content: string;
}

@Injectable()
export class GithubFetcherService {
  private readonly logger = new Logger(GithubFetcherService.name);

  constructor(
    @InjectRepository(GithubTool) private readonly toolRepo: Repository<GithubTool>,
    @InjectRepository(CollectionRecord) private readonly recordRepo: Repository<CollectionRecord>,
    @InjectRepository(FocusConfig) private readonly configRepo: Repository<FocusConfig>,
  ) {}

  @Cron('0 2 * * 0')
  async fetchWeekly() {
    this.logger.log('Starting weekly GitHub tools fetch...');
    try {
      await this.fetchAndSaveTools();
      this.logger.log('Weekly fetch completed');
    } catch (error) {
      this.logger.error('Weekly fetch failed', error instanceof Error ? error.stack : undefined);
    }
  }

  async fetchAndSaveTools() {
    const configs = await this.configRepo.find({ order: { weight: 'DESC' } });
    if (configs.length === 0) {
      this.logger.warn('No focus configs found, skipping fetch');
      return;
    }

    const totalWeight = configs.reduce((sum, config) => sum + config.weight, 0);
    const existingFullNames = await this.getExistingFullNames();
    const tools: GithubTool[] = [];

    for (const config of configs) {
      const quota = Math.max(1, Math.round((config.weight / totalWeight) * 10));
      const fetched = await this.fetchByKeyword(config.keyword, quota, existingFullNames);
      tools.push(...fetched);
    }

    for (const tool of tools.slice(0, 10)) {
      await this.saveTool(tool);
    }
  }

  private async fetchByKeyword(keyword: string, limit: number, existing: Set<string>) {
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
        .filter((item) => !existing.has(item.full_name))
        .map((item) => this.mapToEntity(item));
    } catch (error) {
      this.logger.error(`Failed to fetch ${keyword}`, error instanceof Error ? error.stack : undefined);
      return [];
    }
  }

  private mapToEntity(item: GithubSearchItem) {
    const tool = new GithubTool();
    const [, repoName] = item.full_name.split('/');
    tool.name = repoName;
    tool.fullName = item.full_name;
    tool.url = item.html_url;
    tool.description = item.description;
    tool.stars = item.stargazers_count;
    tool.language = item.language;
    tool.fetchedAt = new Date();
    return tool;
  }

  private async fetchReadmeInfo(owner: string, repo: string): Promise<{ title: string; logoUrl: string | null }> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: {
          'User-Agent': 'ccHub-GitHub-Tools',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return { title: repo, logoUrl: null };
      }

      const data = await response.json() as GithubReadmeResponse;
      const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');

      let title = repo;
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        const normalizedTitle = titleMatch[1]
          .trim()
          .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[`*_~]/g, '')
          .replace(/<[^>]+>/g, '')
          .trim();
        if (normalizedTitle) {
          title = normalizedTitle;
        }
      }

      return {
        title,
        logoUrl: this.extractLogoUrl(content, owner, repo),
      };
    } catch {
      return { title: repo, logoUrl: null };
    }
  }

  private extractLogoUrl(content: string, owner: string, repo: string) {
    const badgeDomains = ['shields.io', 'badge.fury.io', 'badgen.net', 'img.shields.io', 'nodei.co'];
    const skipPaths = ['/actions/', '/workflows/', 'actions/workflows', 'github.com/actions'];
    const imageMatches = [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];

    for (const match of imageMatches) {
      let url = match[2];

      if (badgeDomains.some((domain) => url.includes(domain))) {
        continue;
      }

      if (skipPaths.some((value) => url.includes(value))) {
        continue;
      }

      if (url.startsWith('./')) {
        url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${url.slice(2)}`;
      } else if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
      }

      if (this.isValidImageUrl(url)) {
        return url;
      }
    }

    return null;
  }

  private isValidImageUrl(url: string) {
    try {
      const parsed = new URL(url);
      const validHosts = ['raw.githubusercontent.com', 'githubusercontent.com', 'github.com'];
      const path = parsed.pathname.toLowerCase();

      return validHosts.includes(parsed.hostname)
        && ['http:', 'https:'].includes(parsed.protocol)
        && !path.includes('badge')
        && !path.includes('workflow')
        && !path.includes('/actions/');
    } catch {
      return false;
    }
  }

  private async saveTool(tool: GithubTool) {
    const existing = await this.toolRepo.findOne({ where: { fullName: tool.fullName } });
    if (existing) {
      return;
    }

    const [owner, repo] = tool.fullName.split('/');
    const { title, logoUrl } = await this.fetchReadmeInfo(owner, repo);
    tool.name = title;
    tool.avatarUrl = logoUrl;

    const saved = await this.toolRepo.save(tool);
    const record = new CollectionRecord();
    record.toolId = saved.id;
    record.status = CollectionStatus.UNREAD;
    record.isHidden = false;
    record.statusChangedAt = new Date();
    await this.recordRepo.save(record);
  }

  private async getExistingFullNames() {
    const tools = await this.toolRepo.find();
    return new Set(tools.map((tool) => tool.fullName));
  }
}
