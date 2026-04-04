# 后端知识库

## 1. 定位

`backend/` 是一个基于 NestJS + TypeORM + SQLite 的 REST API 服务，当前承担：

- 用户认证
- TODO 管理
- GitHub 工具抓取与收藏流转
- 系统配置管理
- LLM 代理调用

入口见 [backend/src/main.ts](/Users/lalala/Desktop/ccHub/backend/src/main.ts)。

全局运行基线：

- CORS 开启
- 全局前缀 `/api/v1`
- 全局 `ValidationPipe`
- 全局 `HttpExceptionFilter`
- 全局 `AuthGuard`
- 默认端口 `4000`，可由 `PORT` 覆盖

## 2. 模块结构

根模块见 [backend/src/app.module.ts](/Users/lalala/Desktop/ccHub/backend/src/app.module.ts)。

已注册模块：

- `AuthModule`
- `TodoModule`
- `GithubToolModule`
- `SystemConfigModule`
- `LlmModule`

数据库配置位于：

- [backend/src/database/typeorm.config.ts](/Users/lalala/Desktop/ccHub/backend/src/database/typeorm.config.ts)
- [backend/src/database/run-migrations.ts](/Users/lalala/Desktop/ccHub/backend/src/database/run-migrations.ts)

仓库默认通过 migration 演进数据库，`synchronize` 已关闭。

## 3. 数据模型

### 3.1 UserAccount

实体见 [backend/src/auth/user.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/auth/user.entity.ts)。

字段：

- `id`
- `username`
- `passwordHash`
- `displayName`
- `createdAt`
- `updatedAt`

说明：

- 当前为单主用户模型
- 空库时由 `AuthService` 自动初始化默认账号

### 3.2 Todo

实体见 [backend/src/todo/todo.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/todo/todo.entity.ts)。

字段：

- `id`
- `title`
- `description`
- `status`
- `priority`
- `order`
- `createdAt`
- `updatedAt`

### 3.3 GithubTool

实体见 [backend/src/github-tool/entities/github-tool.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/entities/github-tool.entity.ts)。

重点字段：

- `name`
- `fullName`
- `url`
- `description`
- `stars`
- `language`
- `avatarUrl`
- `descriptionCn`
- `fetchedAt`

### 3.4 CollectionRecord

实体见 [backend/src/github-tool/entities/collection-record.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/entities/collection-record.entity.ts)。

状态：

- `unread`
- `practiced`
- `deep_use`
- `no_longer_used`

额外可见性：

- `isHidden`

### 3.5 FocusConfig

实体见 [backend/src/github-tool/entities/focus-config.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/entities/focus-config.entity.ts)。

字段：

- `keyword`
- `weight`

### 3.6 SystemConfig

实体见 [backend/src/system-config/system-config.entity.ts](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.entity.ts)。

当前承载的 LLM key：

- `llm_api_url`
- `llm_api_key`
- `llm_model`

## 4. 模块职责与请求路径

### 4.1 AuthModule

文件：

- [backend/src/auth/auth.controller.ts](/Users/lalala/Desktop/ccHub/backend/src/auth/auth.controller.ts)
- [backend/src/auth/auth.service.ts](/Users/lalala/Desktop/ccHub/backend/src/auth/auth.service.ts)
- [backend/src/auth/auth.guard.ts](/Users/lalala/Desktop/ccHub/backend/src/auth/auth.guard.ts)

接口：

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

职责：

- 默认用户初始化
- 密码校验与 token 签名
- 全局路由保护

### 4.2 TodoModule

接口：

- `GET /api/v1/todos`
- `POST /api/v1/todos`
- `GET /api/v1/todos/:id`
- `PATCH /api/v1/todos/:id`
- `DELETE /api/v1/todos/:id`

### 4.3 GithubToolModule

文件：

- [backend/src/github-tool/github-tool.controller.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/github-tool.controller.ts)
- [backend/src/github-tool/github-tool.service.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/github-tool.service.ts)
- [backend/src/github-tool/services/github-feed.service.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/services/github-feed.service.ts)
- [backend/src/github-tool/services/github-workflow.service.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/services/github-workflow.service.ts)
- [backend/src/github-tool/services/github-config.service.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/services/github-config.service.ts)
- [backend/src/github-tool/services/github-fetcher.service.ts](/Users/lalala/Desktop/ccHub/backend/src/github-tool/services/github-fetcher.service.ts)

接口：

- `GET /api/v1/github-tools/feed`
- `GET /api/v1/github-tools/collection`
- `POST /api/v1/github-tools/collection/:toolId/keep`
- `POST /api/v1/github-tools/collection/:toolId/hide`
- `PATCH /api/v1/github-tools/collection/:toolId/status`
- `GET /api/v1/github-tools/config`
- `POST /api/v1/github-tools/config`
- `PATCH /api/v1/github-tools/config/:id`
- `DELETE /api/v1/github-tools/config/:id`
- `POST /api/v1/github-tools/fetch`

内部职责：

- `GithubFeedService`：feed / collection 查询与历史清理
- `GithubWorkflowService`：状态流转与非法流转拦截
- `GithubConfigService`：关注词 CRUD
- `GithubFetcherService`：抓取与 README 元数据补全
- `GithubToolService`：向 controller 保持稳定 façade

### 4.4 SystemConfigModule

文件：

- [backend/src/system-config/system-config.service.ts](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.service.ts)
- [backend/src/system-config/system-config.keys.ts](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.keys.ts)
- [backend/src/system-config/system-config.types.ts](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.types.ts)

能力：

- 掩码读取 LLM secret
- 空值与掩码值不覆盖真实 secret
- 通过 typed KV helper 统一 key 访问

### 4.5 LlmModule

文件：

- [backend/src/llm/llm.controller.ts](/Users/lalala/Desktop/ccHub/backend/src/llm/llm.controller.ts)
- [backend/src/llm/llm.service.ts](/Users/lalala/Desktop/ccHub/backend/src/llm/llm.service.ts)
- [backend/src/llm/dto/chat-request.dto.ts](/Users/lalala/Desktop/ccHub/backend/src/llm/dto/chat-request.dto.ts)

接口：

- `POST /api/v1/llm/chat`

说明：

- 现在接受标准多轮 `messages` 数组
- 配置缺失时返回统一错误 envelope

## 5. 统一异常模型

文件：

- [backend/src/common/exceptions/api-error.ts](/Users/lalala/Desktop/ccHub/backend/src/common/exceptions/api-error.ts)
- [backend/src/common/exceptions/error-codes.ts](/Users/lalala/Desktop/ccHub/backend/src/common/exceptions/error-codes.ts)
- [backend/src/common/filters/http-exception.filter.ts](/Users/lalala/Desktop/ccHub/backend/src/common/filters/http-exception.filter.ts)

统一返回字段：

- `code`
- `message`
- `statusCode`
- `details`
- `timestamp`
- `path`

## 6. 维护建议

- 如果后续扩展多用户能力，优先在 `AuthModule` 内演进，而不是向业务模块复制鉴权逻辑
- 如果 GitHub 域继续扩展，优先往 `services/` 下加细分服务，而不是把 façade 再做大
