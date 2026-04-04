import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
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

interface GithubReadmeResponse {
  content: string; // base64 encoded
  encoding: string;
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

  private async fetchReadmeInfo(owner: string, repo: string): Promise<{ title: string; logoUrl: string | null }> {
    try {
      // 使用 GitHub API 获取 README
      const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ccHub-GitHub-Tools',
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return { title: repo, logoUrl: null };
      }

      const data = await response.json() as GithubReadmeResponse;

      // 解码 base64
      const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');

      // 提取标题 (第一个 # 标题，只取纯文本)
      let title = repo;
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        // 去掉标题中的 Markdown 语法（图片、链接等）
        let titleText = titleMatch[1].trim();
        titleText = titleText.replace(/!\[([^\]]*)\]\([^)]+\)/g, ''); // 移除图片
        titleText = titleText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // 链接转为文本
        titleText = titleText.replace(/[`*_~]/g, ''); // 移除行内代码标记
        titleText = titleText.replace(/<[^>]+>/g, ''); // 移除 HTML 标签
        titleText = titleText.trim();
        if (titleText) {
          title = titleText;
        }
      }

      // 提取 Logo (跳过徽章图片和 GitHub Actions)
      const logoUrl = this.extractLogoUrl(content, owner, repo);

      return { title, logoUrl };
    } catch (error) {
      this.logger.warn(`Failed to fetch README for ${owner}/${repo}:`, error);
      return { title: repo, logoUrl: null };
    }
  }

  private extractLogoUrl(content: string, owner: string, repo: string): string | null {
    // 徽章域名列表 (这些不是项目 logo)
    const badgeDomains = ['shields.io', 'badge.fury.io', 'badgen.net', 'img.shields.io', 'nodei.co'];
    // 跳过 GitHub Actions 的 badge
    const skipPaths = ['/actions/', '/workflows/', 'actions/workflows', 'github.com/actions'];

    // 查找所有图片
    const imageMatches = [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];

    for (const match of imageMatches) {
      const altText = match[1].toLowerCase();
      let url = match[2];

      // 跳过徽章
      if (badgeDomains.some(domain => url.includes(domain))) {
        continue;
      }

      // 跳过 GitHub Actions badge
      if (skipPaths.some(path => url.includes(path))) {
        continue;
      }

      // 处理相对路径
      if (url.startsWith('./')) {
        url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${url.slice(2)}`;
      } else if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
      }

      // 验证 URL
      if (this.isValidImageUrl(url)) {
        return url;
      }
    }

    return null;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const validHosts = ['raw.githubusercontent.com', 'githubusercontent.com', 'github.com'];
      if (!validHosts.includes(parsed.hostname)) {
        return false;
      }
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      // 跳过 GitHub Actions 相关的图片（badge、workflow 等）
      const path = parsed.pathname.toLowerCase();
      if (path.includes('badge') || path.includes('workflow') || path.includes('/actions/')) {
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

    // 从 README 提取标题和图标
    const parts = tool.fullName.split('/');
    const { title, logoUrl } = await this.fetchReadmeInfo(parts[0], parts[1]);

    // 使用 README 中的标题（如果从描述中提取的名称不同）
    tool.name = title;
    tool.avatarUrl = logoUrl;

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
