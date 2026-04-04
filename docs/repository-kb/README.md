# 仓库知识库索引

这个目录存放 `ccHub` 的仓库级知识库，目标不是替代源码，而是帮助代理或开发者更快找到正确入口。

## 阅读顺序

1. 先看 [README.md](../../README.md)，确认项目定位、运行方式和默认账号。
2. 做前端改动前看 [frontend-knowledge-base.md](frontend-knowledge-base.md)。
3. 做后端改动前看 [backend-knowledge-base.md](backend-knowledge-base.md)。
4. 涉及本次架构重构背景时，继续看
   [spec.md](../../specs/001-architecture-refactor/spec.md)、
   [plan.md](../../specs/001-architecture-refactor/plan.md)、
   [tasks.md](../../specs/001-architecture-refactor/tasks.md)。

## 快速索引

### 运行与验证

- 项目总览与启动命令：
  [README.md](../../README.md)
- 前端运行说明：
  [frontend/README.md](../../frontend/README.md)

### 前端

- 前端知识库：
  [frontend-knowledge-base.md](frontend-knowledge-base.md)
- 路由入口：
  [frontend/src/App.tsx](../../frontend/src/App.tsx)
- 应用 Provider：
  [frontend/src/app/AppProviders.tsx](../../frontend/src/app/AppProviders.tsx)
- 统一请求层：
  [frontend/src/api/client.ts](../../frontend/src/api/client.ts)
- 登录态：
  [frontend/src/features/auth/authStore.ts](../../frontend/src/features/auth/authStore.ts)
- 对话上下文：
  [frontend/src/features/chat/contextBuilder.ts](../../frontend/src/features/chat/contextBuilder.ts)

### 后端

- 后端知识库：
  [backend-knowledge-base.md](backend-knowledge-base.md)
- 应用入口：
  [backend/src/main.ts](../../backend/src/main.ts)
- 根模块：
  [backend/src/app.module.ts](../../backend/src/app.module.ts)
- 认证体系：
  [backend/src/auth/auth.service.ts](../../backend/src/auth/auth.service.ts)
- migration 配置：
  [backend/src/database/typeorm.config.ts](../../backend/src/database/typeorm.config.ts)
- 统一异常模型：
  [backend/src/common/filters/http-exception.filter.ts](../../backend/src/common/filters/http-exception.filter.ts)

## 使用建议

- 改动前先读对应知识库，再展开源码。
- 代理说明文件应优先链接这里，而不是重复维护大段细节。
- 当架构或运行方式变化时，先更新这里，再同步 `AGENTS.md` 和 `CLAUDE.md`。
