# 后端知识库

## 1. 定位

`backend/` 是一个基于 NestJS + TypeORM + SQLite 的 REST API 服务，当前承担四个业务域：

- TODO 管理
- GitHub 工具抓取与收藏流转
- 系统配置管理
- LLM 代理调用

入口见 [backend/src/main.ts](/Users/lalala/Desktop/ccHub/backend/src/main.ts)。

全局配置：

- 开启 CORS
- 全局前缀 `/api/v1`
- 全局 `ValidationPipe({ transform: true })`
- 默认监听 `4000`

## 2. 模块结构

根模块见 [backend/src/app.module.ts](/Users/lalala/Desktop/ccHub/backend/src/app.module.ts)。

已注册模块：

- `TodoModule`
- `GithubToolModule`
- `SystemConfigModule`
- `LlmModule`

TypeORM 使用 `better-sqlite3`，数据库路径默认 `./database.sqlite`，可由 `DATABASE_PATH` 覆盖。当前打开了 `synchronize: true`，说明仍偏开发态策略。

## 3. 数据模型

### 3.1 Todo

实体见 [backend/src/todo/todo.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/todo/todo.entity.ts)。

字段：

- `id`
- `title`
- `description`
- `status`: `pending | in_progress | done`
- `priority`: `low | medium | high`
- `order`
- `createdAt`
- `updatedAt`

说明：

- 列表排序依赖 `order ASC, createdAt DESC`
- 前端当前没有提供拖拽排序 UI，但后端已预留 `order`

### 3.2 GithubTool

实体见 [backend/src/github-tool/entities/github-tool.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/entities/github-tool.entity.ts)。

字段重点：

- `name`
- `fullName`，唯一键
- `url`
- `description`
- `descriptionCn`
- `stars`
- `language`
- `avatarUrl`
- `fetchedAt`

### 3.3 CollectionRecord

实体见 [backend/src/github-tool/entities/collection-record.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/entities/collection-record.entity.ts)。

作用：

- 记录工具的收藏/隐藏/状态流转

关键字段：

- `toolId`
- `status`
- `isHidden`
- `statusChangedAt`

状态枚举：

- `unread`
- `practiced`
- `deep_use`
- `no_longer_used`

### 3.4 FocusConfig

实体见 [backend/src/github-tool/entities/focus-config.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/entities/focus-config.entity.ts)。

作用：

- 存用户关注关键词及权重，驱动 GitHub 抓取配额分配

字段：

- `keyword`
- `weight`

### 3.5 SystemConfig

实体见 [backend/src/system-config/system-config.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.entity.ts)。

作用：

- 通用 KV 配置表，当前主要承载 LLM 配置

字段：

- `key`
- `value`
- `category`

当前 LLM 相关 key：

- `llm_api_url`
- `llm_api_key`
- `llm_model`

## 4. 模块职责与请求路径

### 4.1 TodoModule

文件：

- [backend/src/todo/todo.controller.ts](/Users/lalala/Desktop/ccHub/backend/src/todo/todo.controller.ts)
- [backend/src/todo/todo.service.ts](/Users/lalala/Desktop/ccHub/backend/src/todo/todo.service.ts)

接口：

- `GET /api/v1/todos`
- `POST /api/v1/todos`
- `GET /api/v1/todos/:id`
- `PATCH /api/v1/todos/:id`
- `DELETE /api/v1/todos/:id`

职责划分：

- Controller 只做路由映射和参数解析
- Service 直接通过 TypeORM Repository 完成 CRUD

特点：

- 是当前最标准、最薄的一层业务模块
- `findOne()` 封装了 `NotFoundException`，复用在更新和删除中

### 4.2 GithubToolModule

文件：

- [backend/src/github-tool/github-tool.controller.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/github-tool.controller.ts)
- [backend/src/github-tool/github-tool.service.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/github-tool.service.ts)
- [backend/src/github-tool/github-fetcher.service.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/github-fetcher.service.ts)

接口分两类：

业务查询/流转：

- `GET /api/v1/github-tools/feed`
- `GET /api/v1/github-tools/collection`
- `POST /api/v1/github-tools/collection/:toolId/keep`
- `POST /api/v1/github-tools/collection/:toolId/hide`
- `PATCH /api/v1/github-tools/collection/:toolId/status`

配置管理：

- `GET /api/v1/github-tools/config`
- `POST /api/v1/github-tools/config`
- `DELETE /api/v1/github-tools/config/:id`
- `PATCH /api/v1/github-tools/config/:id`

抓取入口：

- `POST /api/v1/github-tools/fetch`

#### GithubToolService 负责什么

- unread feed 查询
- 收藏列表查询
- 状态流转与隐藏
- 关注关键词 CRUD
- 半年历史记录清理

#### GithubFetcherService 负责什么

- 按 cron 周期抓取 GitHub 仓库
- 根据关键词权重分配 quota
- 调 GitHub Search API 拉仓库
- 调 GitHub README API 抽标题和 logo
- 保存 `GithubTool`
- 自动创建初始 `CollectionRecord`

定时任务：

- `@Cron('0 2 * * 0')`
- 注释写的是“每周日凌晨 2 点”

## 5. GitHub 工具业务流程

### 5.1 数据进入系统

1. 用户在配置里维护 `FocusConfig`
2. 定时任务或手动接口触发抓取
3. 后端按权重为关键词分配仓库抓取数
4. 查询 GitHub Search API
5. 去除数据库已有的 `fullName`
6. 读取 README，补充标题与 logo
7. 保存工具
8. 为新工具自动创建 `CollectionRecord(status=unread, isHidden=false)`

### 5.2 数据在系统内流转

- unread：新抓取进入初始态
- keep：后端将其直接改为 `practiced`
- updateStatus：手动推进到 `deep_use` 或 `no_longer_used`
- hide：将 `isHidden` 设为 `true`

### 5.3 清理策略

`getCollection()` 调用时会触发 `cleanupOldRecords()`：

- 半年前的记录会被删除
- `deep_use` 不删
- `isHidden = false` 才参与清理

这是一种“查询时顺手清理”的模式，不是独立后台任务。

## 6. SystemConfig 与 LLM 的关系

### 6.1 SystemConfigModule

文件：

- [backend/src/system-config/system-config.controller.ts](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.controller.ts)
- [backend/src/system-config/system-config.service.ts](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.service.ts)

接口：

- `GET /api/v1/system-config/llm`
- `PUT /api/v1/system-config/llm`

服务层提供两类能力：

- 对外读取时返回掩码后的 API Key
- 给 `LlmService` 读取时返回原始 API Key

### 6.2 LlmModule

文件：

- [backend/src/llm/llm.controller.ts](/Users/lalala/Desktop/ccHub/backend/src/llm/llm.controller.ts)
- [backend/src/llm/llm.service.ts](/Users/lalala/Desktop/ccHub/backend/src/llm/llm.service.ts)

接口：

- `POST /api/v1/llm/chat`

当前职责不是“智能体编排”，而是“按配置转发请求”。

实现特点：

- 从 `SystemConfigService` 取实时配置
- 通过 `apiUrl.includes('anthropic')` 判断供应商协议
- Anthropic 分支请求 `${apiUrl}/messages`
- OpenAI 分支请求 `${apiUrl}/chat/completions`
- 统一 30 秒超时
- 统一把最终文本抽成字符串返回给前端

`summarizeTool()` 已封装，但目前未看到被 GitHub 抓取流程实际调用。

## 7. DTO 与校验

### TODO DTO

文件：

- [backend/src/todo/dto/create-todo.dto.ts](/Users/lalala/Desktop/ccHub/backend/src/todo/dto/create-todo.dto.ts)
- [backend/src/todo/dto/update-todo.dto.ts](/Users/lalala/Desktop/ccHub/backend/src/todo/dto/update-todo.dto.ts)

校验内容：

- 标题/描述字符串
- 状态枚举
- 优先级枚举
- `order` 数字

### GitHub Tool DTO

文件：

- [backend/src/github-tool/dto/create-focus-config.dto.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/dto/create-focus-config.dto.ts)
- [backend/src/github-tool/dto/update-status.dto.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/dto/update-status.dto.ts)

说明：

- `CreateFocusConfigDto` 已校验关键词和权重区间
- `updateConfig` 的 `weight` 当前直接通过 `@Body('weight')` 读取，没有独立 DTO

## 8. 测试现状

后端已经存在 Jest 单测，主要覆盖：

- `GithubToolController`
- `GithubToolService`
- `GithubFetcherService`
- GitHub 工具实体

但测试内容与代码已出现漂移，说明测试维护尚未跟上重构节奏。

## 9. 维护建议

- 尽快从 `synchronize: true` 迁移到 migration 模式。
- 为系统配置与 LLM 模块补充更严格的输入约束和异常模型。
- 将 GitHub 抓取、清理、推荐策略进一步拆开，降低服务类职责密度。
- 为 feed/collection 的状态语义补一层明确的领域规则，避免前后端理解不一致。

