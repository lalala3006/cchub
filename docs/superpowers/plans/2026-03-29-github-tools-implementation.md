# GitHub 工具收藏模块实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 每周自动抓取 GitHub 热门项目，按关注领域筛选，用户可收藏/隐藏并跟踪学习状态

**Architecture:** 后端 NestJS 模块提供 API，定时任务抓取 GitHub 数据；前端 React 页面展示和管理收藏，使用 Ant Design 组件

**Tech Stack:** NestJS + TypeORM, React + TypeScript + Ant Design, SQLite, NestJS Schedule

---

## 文件结构

```
backend/src/
├── github-tool/
│   ├── github-tool.module.ts      # 根模块
│   ├── github-tool.controller.ts  # API 路由
│   ├── github-tool.service.ts     # 业务逻辑
│   ├── entities/
│   │   ├── github-tool.entity.ts  # github_tool 表
│   │   ├── collection-record.entity.ts  # collection_record 表
│   │   └── focus-config.entity.ts # focus_config 表
│   ├── dto/
│   │   ├── create-focus-config.dto.ts
│   │   └── update-status.dto.ts
│   └── github-fetcher.service.ts  # GitHub API 抓取

frontend/src/
├── api/
│   └── githubToolsApi.ts          # API 调用层
├── components/
│   └── GithubTools/
│       ├── GithubToolsPage.tsx    # 主页面
│       ├── GithubToolsPage.module.css
│       ├── ToolCard.tsx           # 工具卡片
│       ├── ToolCard.module.css
│       ├── ConfigModal.tsx        # 配置弹窗
│       └── ConfigModal.module.css
└── App.tsx                        # 添加路由
```

---

## Chunk 1: 后端 - 数据库实体

**Files:**
- Create: `backend/src/github-tool/entities/github-tool.entity.ts`
- Create: `backend/src/github-tool/entities/collection-record.entity.ts`
- Create: `backend/src/github-tool/entities/focus-config.entity.ts`
- Modify: `backend/src/app.module.ts` - 导入 GithubToolModule

- [ ] **Step 1: 创建 github-tool.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class GithubTool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  fullName: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  stars: number;

  @Column({ nullable: true })
  language: string;

  @Column({ type: 'datetime' })
  fetchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 2: 创建 collection-record.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GithubTool } from './github-tool.entity';

export enum CollectionStatus {
  UNREAD = 'unread',
  PRACTICED = 'practiced',
  DEEP_USE = 'deep_use',
  NO_LONGER_USED = 'no_longer_used',
}

@Entity()
export class CollectionRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  toolId: number;

  @ManyToOne(() => GithubTool)
  @JoinColumn({ name: 'toolId' })
  tool: GithubTool;

  @Column({ type: 'text', default: CollectionStatus.UNREAD })
  status: CollectionStatus;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'datetime' })
  statusChangedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 3: 创建 focus-config.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class FocusConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  keyword: string;

  @Column({ default: 5 })
  weight: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 4: 修改 app.module.ts，导入 GithubToolModule**

在 `TypeOrmModule.forRoot` 中添加 `entities: [GithubTool, CollectionRecord, FocusConfig]`
并导入 `GithubToolModule`

- [ ] **Step 5: 提交**

```bash
git add backend/src/github-tool/entities/ backend/src/app.module.ts
git commit -m "feat: add GitHub tools database entities"
```

---

## Chunk 2: 后端 - Controller 和 Service

**Files:**
- Create: `backend/src/github-tool/dto/create-focus-config.dto.ts`
- Create: `backend/src/github-tool/dto/update-status.dto.ts`
- Create: `backend/src/github-tool/github-tool.service.ts`
- Create: `backend/src/github-tool/github-tool.controller.ts`
- Modify: `backend/src/github-tool/github-tool.module.ts`

- [ ] **Step 1: 创建 DTO**

```typescript
// create-focus-config.dto.ts
import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreateFocusConfigDto {
  @IsString()
  keyword: string;

  @IsInt()
  @Min(1)
  @Max(10)
  weight: number;
}
```

```typescript
// update-status.dto.ts
import { IsEnum } from 'class-validator';
import { CollectionStatus } from '../entities/collection-record.entity';

export class UpdateStatusDto {
  @IsEnum(CollectionStatus)
  status: CollectionStatus;
}
```

- [ ] **Step 2: 创建 github-tool.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan } from 'typeorm';
import { GithubTool } from './entities/github-tool.entity';
import { CollectionRecord, CollectionStatus } from './entities/collection-record.entity';
import { FocusConfig } from './entities/focus-config.entity';
import { CreateFocusConfigDto } from './dto/create-focus-config.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class GithubToolService {
  constructor(
    @InjectRepository(GithubTool) private toolRepo: Repository<GithubTool>,
    @InjectRepository(CollectionRecord) private recordRepo: Repository<CollectionRecord>,
    @InjectRepository(FocusConfig) private configRepo: Repository<FocusConfig>,
  ) {}

  // Feed: 本周推荐（去重、排除已隐藏）
  async getFeed(): Promise<GithubTool[]> {
    const hiddenToolIds = await this.recordRepo.find({ where: { isHidden: true }, select: ['toolId'] });
    const hiddenIds = hiddenToolIds.map(r => r.toolId);

    const query = this.toolRepo.createQueryBuilder('tool')
      .leftJoinAndSelect('tool.collectionRecord', 'record')
      .orderBy('tool.createdAt', 'DESC')
      .take(10);

    if (hiddenIds.length > 0) {
      query.where('tool.id NOT IN (:...hiddenIds)', { hiddenIds });
    }

    return query.getMany();
  }

  // 按状态查询收藏
  async getCollection(status?: CollectionStatus, search?: string): Promise<CollectionRecord[]> {
    const qb = this.recordRepo.createQueryBuilder('record')
      .leftJoinAndSelect('record.tool', 'tool')
      .where('record.isHidden = :hidden', { hidden: false });

    if (status) {
      qb.andWhere('record.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(tool.name LIKE :search OR tool.description LIKE :search)', { search: `%${search}%` });
    }

    // 清理超过半年的记录（除了 deep_use）
    await this.cleanupOldRecords();

    return qb.orderBy('record.statusChangedAt', 'DESC').getMany();
  }

  // 保留到收藏
  async keepTool(toolId: number): Promise<CollectionRecord> {
    let record = await this.recordRepo.findOne({ where: { toolId } });
    if (!record) {
      record = this.recordRepo.create({ toolId, status: CollectionStatus.UNREAD });
    }
    record.status = CollectionStatus.PRACTICED;
    record.statusChangedAt = new Date();
    return this.recordRepo.save(record);
  }

  // 隐藏
  async hideTool(toolId: number): Promise<void> {
    let record = await this.recordRepo.findOne({ where: { toolId } });
    if (!record) {
      record = this.recordRepo.create({ toolId });
    }
    record.isHidden = true;
    record.statusChangedAt = new Date();
    await this.recordRepo.save(record);
  }

  // 更新状态
  async updateStatus(toolId: number, dto: UpdateStatusDto): Promise<CollectionRecord> {
    const record = await this.recordRepo.findOne({ where: { toolId } });
    if (!record) {
      throw new Error('Record not found');
    }
    record.status = dto.status;
    record.statusChangedAt = new Date();
    return this.recordRepo.save(record);
  }

  // 配置管理
  async getConfig(): Promise<FocusConfig[]> {
    return this.configRepo.find({ order: { weight: 'DESC' } });
  }

  async createConfig(dto: CreateFocusConfigDto): Promise<FocusConfig> {
    const config = this.configRepo.create(dto);
    return this.configRepo.save(config);
  }

  async deleteConfig(id: number): Promise<void> {
    await this.configRepo.delete(id);
  }

  async updateConfig(id: number, weight: number): Promise<FocusConfig> {
    await this.configRepo.update(id, { weight });
    return this.configRepo.findOne({ where: { id } });
  }

  // 清理超过半年的记录
  private async cleanupOldRecords(): Promise<void> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    await this.recordRepo.delete({
      status: Not(CollectionStatus.DEEP_USE),
      statusChangedAt: LessThan(sixMonthsAgo),
      isHidden: false,
    });
  }
}
```

- [ ] **Step 3: 创建 github-tool.controller.ts**

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { GithubToolService } from './github-tool.service';
import { CreateFocusConfigDto } from './dto/create-focus-config.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CollectionStatus } from './entities/collection-record.entity';

@Controller('github-tools')
export class GithubToolController {
  constructor(private readonly service: GithubToolService) {}

  @Get('feed')
  getFeed() {
    return this.service.getFeed();
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
```

- [ ] **Step 4: 创建 github-tool.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubToolController } from './github-tool.controller';
import { GithubToolService } from './github-tool.service';
import { GithubTool } from './entities/github-tool.entity';
import { CollectionRecord } from './entities/collection-record.entity';
import { FocusConfig } from './entities/focus-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GithubTool, CollectionRecord, FocusConfig])],
  controllers: [GithubToolController],
  providers: [GithubToolService],
  exports: [GithubToolService],
})
export class GithubToolModule {}
```

- [ ] **Step 5: 提交**

```bash
git add backend/src/github-tool/
git commit -m "feat: add GitHub tools controller and service"
```

---

## Chunk 3: 后端 - GitHub 抓取服务和定时任务

**Files:**
- Create: `backend/src/github-tool/github-fetcher.service.ts`
- Modify: `backend/src/github-tool/github-tool.module.ts` - 添加 ScheduleModule
- Modify: `backend/src/main.ts` - 添加 ScheduleModule

- [ ] **Step 1: 创建 github-fetcher.service.ts**

```typescript
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

  private async saveTool(tool: GithubTool): Promise<void> {
    const existing = await this.toolRepo.findOne({ where: { fullName: tool.fullName } });
    if (existing) return;

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
```

- [ ] **Step 2: 修改 github-tool.module.ts，导入 ScheduleModule**

```typescript
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
```

- [ ] **Step 3: 安装 @nestjs/schedule 包**

```bash
cd backend && npm install @nestjs/schedule
```

- [ ] **Step 4: 提交**

```bash
git add backend/src/github-tool/ backend/package.json
git commit -m "feat: add GitHub fetcher service and cron job"
```

---

## Chunk 4: 前端 - API 层

**Files:**
- Create: `frontend/src/api/githubToolsApi.ts`
- Modify: `frontend/src/api/todoApi.ts` (参考现有模式)

- [ ] **Step 1: 创建 githubToolsApi.ts**

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export type CollectionStatus = 'unread' | 'practiced' | 'deep_use' | 'no_longer_used';

export interface GithubTool {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string;
  stars: number;
  language: string;
  fetchedAt: string;
  createdAt: string;
}

export interface CollectionRecord {
  id: number;
  toolId: number;
  tool: GithubTool;
  status: CollectionStatus;
  isHidden: boolean;
  statusChangedAt: string;
  createdAt: string;
}

export interface FocusConfig {
  id: number;
  keyword: string;
  weight: number;
  createdAt: string;
}

export const githubToolsApi = {
  // 获取本周推荐
  async getFeed(): Promise<GithubTool[]> {
    const res = await fetch(`${API_BASE_URL}/github-tools/feed`);
    return res.json();
  },

  // 获取收藏列表
  async getCollection(status?: CollectionStatus, search?: string): Promise<CollectionRecord[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const res = await fetch(`${API_BASE_URL}/github-tools/collection?${params}`);
    return res.json();
  },

  // 保留
  async keepTool(toolId: number): Promise<CollectionRecord> {
    const res = await fetch(`${API_BASE_URL}/github-tools/collection/${toolId}/keep`, { method: 'POST' });
    return res.json();
  },

  // 隐藏
  async hideTool(toolId: number): Promise<void> {
    await fetch(`${API_BASE_URL}/github-tools/collection/${toolId}/hide`, { method: 'POST' });
  },

  // 更新状态
  async updateStatus(toolId: number, status: CollectionStatus): Promise<CollectionRecord> {
    const res = await fetch(`${API_BASE_URL}/github-tools/collection/${toolId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // 配置
  async getConfig(): Promise<FocusConfig[]> {
    const res = await fetch(`${API_BASE_URL}/github-tools/config`);
    return res.json();
  },

  async createConfig(keyword: string, weight: number): Promise<FocusConfig> {
    const res = await fetch(`${API_BASE_URL}/github-tools/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, weight }),
    });
    return res.json();
  },

  async deleteConfig(id: number): Promise<void> {
    await fetch(`${API_BASE_URL}/github-tools/config/${id}`, { method: 'DELETE' });
  },

  async updateConfig(id: number, weight: number): Promise<FocusConfig> {
    const res = await fetch(`${API_BASE_URL}/github-tools/config/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight }),
    });
    return res.json();
  },

  // 触发抓取
  async triggerFetch(): Promise<void> {
    await fetch(`${API_BASE_URL}/github-tools/fetch`, { method: 'POST' });
  },
};
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/api/githubToolsApi.ts
git commit -m "feat: add GitHub tools API layer"
```

---

## Chunk 5: 前端 - 工具卡片组件

**Files:**
- Create: `frontend/src/components/GithubTools/ToolCard.tsx`
- Create: `frontend/src/components/GithubTools/ToolCard.module.css`

- [ ] **Step 1: 创建 ToolCard.tsx**

```tsx
import { Card, Button, Tag, Space } from 'antd';
import { GithubTool, CollectionRecord, CollectionStatus } from '../../api/githubToolsApi';
import styles from './ToolCard.module.css';

interface ToolCardProps {
  tool: GithubTool | CollectionRecord;
  mode: 'feed' | 'collection';
  onKeep?: (toolId: number) => void;
  onHide?: (toolId: number) => void;
  onStatusChange?: (toolId: number, status: CollectionStatus) => void;
}

export function ToolCard({ tool, mode, onKeep, onHide, onStatusChange }: ToolCardProps) {
  const actualTool = 'tool' in tool ? tool.tool : tool;
  const status = 'status' in tool ? tool.status : undefined;

  const statusLabels: Record<CollectionStatus, string> = {
    unread: '未读',
    practiced: '已实践',
    deep_use: '深度使用',
    no_longer_used: '不再使用',
  };

  const nextStatusMap: Partial<Record<CollectionStatus, CollectionStatus>> = {
    practiced: 'deep_use',
    deep_use: 'no_longer_used',
  };

  return (
    <Card className={styles.card} hoverable>
      <div className={styles.header}>
        <a href={actualTool.url} target="_blank" rel="noopener noreferrer" className={styles.title}>
          {actualTool.name}
        </a>
        <Space>
          {status && <Tag>{statusLabels[status]}</Tag>}
          <Tag>{actualTool.stars.toLocaleString()} ⭐</Tag>
          {actualTool.language && <Tag color="blue">{actualTool.language}</Tag>}
        </Space>
      </div>
      <p className={styles.description}>{actualTool.description || '暂无描述'}</p>
      {mode === 'feed' && (
        <Space className={styles.actions}>
          <Button type="primary" onClick={() => onKeep?.(actualTool.id)}>
            保留
          </Button>
          <Button onClick={() => onHide?.(actualTool.id)}>不感兴趣</Button>
        </Space>
      )}
      {mode === 'collection' && status && nextStatusMap[status] && (
        <Space className={styles.actions}>
          <Button type="primary" onClick={() => onStatusChange?.(actualTool.id, nextStatusMap[status]!)}>
            标记为{statusLabels[nextStatusMap[status]!]}
          </Button>
        </Space>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: 创建 ToolCard.module.css**

```css
.card {
  margin-bottom: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.title:hover {
  text-decoration: underline;
}

.description {
  color: #666;
  margin-bottom: 12px;
  min-height: 40px;
}

.actions {
  margin-top: 8px;
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/GithubTools/ToolCard.tsx frontend/src/components/GithubTools/ToolCard.module.css
git commit -m "feat: add ToolCard component"
```

---

## Chunk 6: 前端 - 配置弹窗

**Files:**
- Create: `frontend/src/components/GithubTools/ConfigModal.tsx`
- Create: `frontend/src/components/GithubTools/ConfigModal.module.css`

- [ ] **Step 1: 创建 ConfigModal.tsx**

```tsx
import { useState, useEffect } from 'react';
import { Modal, Form, Input, Slider, Button, List, Space, message } from 'antd';
import { githubToolsApi, FocusConfig } from '../../api/githubToolsApi';
import styles from './ConfigModal.module.css';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConfigModal({ open, onClose }: ConfigModalProps) {
  const [configs, setConfigs] = useState<FocusConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      loadConfigs();
    }
  }, [open]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await githubToolsApi.getConfig();
      setConfigs(data);
    } catch {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values: { keyword: string; weight: number }) => {
    try {
      await githubToolsApi.createConfig(values.keyword, values.weight);
      message.success('添加成功');
      form.resetFields();
      loadConfigs();
    } catch {
      message.error('添加失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await githubToolsApi.deleteConfig(id);
      message.success('删除成功');
      loadConfigs();
    } catch {
      message.error('删除失败');
    }
  };

  const handleUpdateWeight = async (id: number, weight: number) => {
    try {
      await githubToolsApi.updateConfig(id, weight);
      loadConfigs();
    } catch {
      message.error('更新失败');
    }
  };

  return (
    <Modal title="GitHub 工具收藏配置" open={open} onCancel={onClose} footer={null} width={600}>
      <Form form={form} layout="inline" onFinish={handleAdd} className={styles.form}>
        <Form.Item name="keyword" rules={[{ required: true, message: '请输入关键词' }]}>
          <Input placeholder="关注领域关键词" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="weight" initialValue={5} rules={[{ required: true }]}>
          <Slider min={1} max={10} style={{ width: 120 }} tooltip={{ formatter: (v) => `权重: ${v}` }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            添加
          </Button>
        </Form.Item>
      </Form>

      <List
        className={styles.list}
        loading={loading}
        dataSource={configs}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link" danger onClick={() => handleDelete(item.id)}>
                删除
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={item.keyword}
              description={
                <Space>
                  <span>权重:</span>
                  <Slider
                    min={1}
                    max={10}
                    value={item.weight}
                    style={{ width: 100 }}
                    onChange={(v) => handleUpdateWeight(item.id, v)}
                    tooltip={{ formatter: (v) => `${v}` }}
                  />
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
```

- [ ] **Step 2: 创建 ConfigModal.module.css**

```css
.form {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.list {
  max-height: 400px;
  overflow-y: auto;
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/GithubTools/ConfigModal.tsx frontend/src/components/GithubTools/ConfigModal.module.css
git commit -m "feat: add ConfigModal component"
```

---

## Chunk 7: 前端 - 主页面

**Files:**
- Create: `frontend/src/pages/GithubToolsPage.tsx`
- Create: `frontend/src/components/GithubTools/GithubToolsPage.module.css`
- Create: `frontend/src/components/GithubTools/index.ts` (导出组件)

- [ ] **Step 1: 创建 GithubToolsPage.tsx**

```tsx
import { useState, useEffect } from 'react';
import { Tabs, Input, Spin, message } from 'antd';
import { GithubTool, CollectionRecord, CollectionStatus, githubToolsApi } from '../api/githubToolsApi';
import { ToolCard } from '../components/GithubTools/ToolCard';
import { ConfigModal } from '../components/GithubTools/ConfigModal';
import styles from '../components/GithubTools/GithubToolsPage.module.css';

const { Search } = Input;

export function GithubToolsPage() {
  const [activeTab, setActiveTab] = useState<CollectionStatus>('unread');
  const [feed, setFeed] = useState<GithubTool[]>([]);
  const [collection, setCollection] = useState<CollectionRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    loadCollection();
  }, [activeTab, search]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await githubToolsApi.getFeed();
      setFeed(data);
    } catch {
      message.error('加载推荐失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCollection = async () => {
    setLoading(true);
    try {
      const data = await githubToolsApi.getCollection(activeTab, search || undefined);
      setCollection(data);
    } catch {
      message.error('加载收藏失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeep = async (toolId: number) => {
    try {
      await githubToolsApi.keepTool(toolId);
      message.success('已保留');
      loadFeed();
      loadCollection();
    } catch {
      message.error('操作失败');
    }
  };

  const handleHide = async (toolId: number) => {
    try {
      await githubToolsApi.hideTool(toolId);
      message.success('已隐藏');
      loadFeed();
    } catch {
      message.error('操作失败');
    }
  };

  const handleStatusChange = async (toolId: number, status: CollectionStatus) => {
    try {
      await githubToolsApi.updateStatus(toolId, status);
      message.success('状态已更新');
      loadCollection();
    } catch {
      message.error('操作失败');
    }
  };

  return (
    <div className={styles.page}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as CollectionStatus)}
        items={[
          { key: 'unread', label: '未读', children: (
            <Search placeholder="搜索项目名或描述" onSearch={setSearch} enterButton allowClear />
          )},
          { key: 'practiced', label: '已实践', children: (
            <Search placeholder="搜索项目名或描述" onSearch={setSearch} enterButton allowClear />
          )},
          { key: 'deep_use', label: '深度使用', children: (
            <Search placeholder="搜索项目名或描述" onSearch={setSearch} enterButton allowClear />
          )},
        ]}
      />

      <div className={styles.configBtn}>
        <Button onClick={() => setConfigModalOpen(true)}>配置关注领域</Button>
      </div>

      <Spin spinning={loading}>
        <div className={styles.list}>
          {activeTab === 'unread' && feed.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              mode="feed"
              onKeep={handleKeep}
              onHide={handleHide}
            />
          ))}
          {(activeTab === 'practiced' || activeTab === 'deep_use') && collection.map((record) => (
            <ToolCard
              key={record.id}
              tool={record}
              mode="collection"
              onStatusChange={handleStatusChange}
            />
          ))}
          {((activeTab === 'practiced' || activeTab === 'deep_use') && collection.length === 0) && (
            <Empty description="暂无数据" />
          )}
        </div>
      </Spin>

      <ConfigModal open={configModalOpen} onClose={() => setConfigModalOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2: 创建 GithubToolsPage.module.css**

```css
.page {
  padding: 24px;
}

.configBtn {
  margin-bottom: 16px;
  text-align: right;
}

.list {
  min-height: 200px;
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/GithubToolsPage.tsx frontend/src/components/GithubTools/
git commit -m "feat: add GitHub tools page"
```

---

## Chunk 8: 前端 - 路由和入口图标

**Files:**
- Modify: `frontend/src/App.tsx` - 添加路由
- Modify: `frontend/src/components/Layout/Sidebar.tsx` - 添加菜单项
- Modify: `frontend/src/components/Layout/Layout.tsx` - 添加右上角图标

- [ ] **Step 1: 修改 App.tsx，添加路由**

在 TodoPage 路由旁添加：
```tsx
import { GithubToolsPage } from './pages/GithubToolsPage';

// 在 Routes 中添加
<Route path="github-tools" element={<GithubToolsPage />} />
```

- [ ] **Step 2: 修改 Sidebar.tsx，添加菜单项**

在菜单数组中添加：
```tsx
{
  key: '/github-tools',
  label: 'GitHub 工具',
  icon: <GithubOutlined />,
},
```

需要导入 `GithubOutlined` from 'antd/icons-icons';

- [ ] **Step 3: 修改 Layout.tsx，添加右上角图标**

在侧边栏头部区域添加设置图标，点击打开 ConfigModal

- [ ] **Step 4: 提交**

```bash
git add frontend/src/App.tsx frontend/src/components/Layout/
git commit -m "feat: add GitHub tools routing and entry icon"
```

---

## 总结

| Chunk | 内容 | 改动文件数 |
|-------|------|-----------|
| 1 | 数据库实体 | 4 |
| 2 | Controller/Service | 5 |
| 3 | GitHub 抓取服务 | 3 |
| 4 | 前端 API 层 | 1 |
| 5 | 工具卡片组件 | 2 |
| 6 | 配置弹窗组件 | 2 |
| 7 | 主页面 | 3 |
| 8 | 路由和入口 | 3 |

**执行顺序**: Chunk 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
