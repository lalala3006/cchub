# ccHub

ccHub 是一个前后端分离的个人工具站，当前包含三条主业务线：

- TODO 管理
- GitHub 工具发现与收藏流转
- 基于可配置 LLM 的主页对话助手

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 + TypeScript + Vite + React Router + Ant Design |
| 后端 | NestJS 11 + TypeScript + TypeORM |
| 数据库 | SQLite (`better-sqlite3`) |
| 部署 | Docker Compose |

## 仓库结构

```text
ccHub/
├── frontend/     # React SPA
├── backend/      # NestJS API
├── docs/         # 设计文档与仓库知识库
├── nginx/        # 部署相关配置
└── docker-compose.yml
```

## 当前功能

### 前端

- `/`：AI 对话页，会聚合 TODO 和 GitHub 工具上下文后请求后端 LLM 接口
- `/todo`：任务 CRUD
- `/github-tools`：推荐流、收藏状态流转、关注关键词配置
- `/settings`：LLM 配置管理

### 后端

- `TodoModule`：TODO CRUD
- `GithubToolModule`：GitHub 抓取、收藏记录、关注词配置
- `SystemConfigModule`：系统配置持久化，当前主要承载 LLM 配置
- `LlmModule`：按配置代理外部 LLM API

## 本地运行

### 前端

```bash
cd frontend
npm install
npm run dev
```

默认访问 [http://localhost:5173](http://localhost:5173)。

### 后端

```bash
cd backend
npm install
npm run start:dev
```

默认监听 [http://localhost:4000/api/v1](http://localhost:4000/api/v1)。

### Docker Compose

```bash
docker compose up --build
```

启动后：

- 前端：`http://localhost:3000`
- 后端：`http://localhost:4000/api/v1`

## 质量检查

```bash
cd frontend && npm run lint
cd frontend && npm run build
cd backend && npm run build
cd backend && npm test -- --runInBand
```

## 进一步阅读

- [前端知识库](/Users/lalala/Desktop/ccHub/docs/repository-kb/frontend-knowledge-base.md)
- [后端知识库](/Users/lalala/Desktop/ccHub/docs/repository-kb/backend-knowledge-base.md)
- [代码 Review](/Users/lalala/Desktop/ccHub/docs/repository-kb/code-review.md)
