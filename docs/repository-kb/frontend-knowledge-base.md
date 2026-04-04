# 前端知识库

## 1. 定位

`frontend/` 是一个基于 React 19 + TypeScript + Vite 的单页应用，承担三个主要界面域：

- 主页 `/`：AI 对话入口，拼接本地业务上下文后请求后端 LLM 接口。
- TODO `/todo`：任务管理 CRUD 页面。
- GitHub 工具 `/github-tools`：项目推荐、收藏状态流转、关注关键词配置。
- 设置 `/settings`：LLM 配置管理。

前端当前没有全局状态库，主要依赖页面级 `useState` / `useEffect` 管理远程数据和 UI 状态。

## 2. 技术栈与运行方式

- 路由：`react-router-dom`
- UI 组件：`antd`，但项目中也混用了不少原生 `button` / `input`
- 构建：Vite
- API 通信：浏览器原生 `fetch`

开发态通过 [frontend/vite.config.ts](/Users/lalala/Desktop/ccHub/frontend/vite.config.ts) 将 `/api` 代理到 `http://localhost:4000`。

API 基地址的写法分两种：

- 大多数模块默认 `import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'`
- Docker Compose 中为前端构建传入 `VITE_API_URL=/api/v1`

这意味着：

- 本地裸跑时前端会直接请求 `4000`
- 容器部署时前端会请求同域 `/api/v1`

## 3. 路由与页面分工

入口见 [frontend/src/App.tsx](/Users/lalala/Desktop/ccHub/frontend/src/App.tsx)。

- `/` -> [frontend/src/pages/HomePage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/HomePage.tsx)
- `/todo` -> [frontend/src/pages/TodoPage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/TodoPage.tsx)
- `/github-tools` -> [frontend/src/pages/GithubToolsPage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/GithubToolsPage.tsx)
- `/settings` -> [frontend/src/pages/SettingsPage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/SettingsPage.tsx)

公共外壳由 [frontend/src/components/Layout/Layout.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/Layout/Layout.tsx) 和 [frontend/src/components/Layout/Sidebar.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/Layout/Sidebar.tsx) 提供，采用“左侧导航 + 右侧内容区”的后台布局。

## 4. API 层设计

当前 API 封装集中在 `frontend/src/api/`：

- [frontend/src/api/todoApi.ts](/Users/lalala/Desktop/ccHub/frontend/src/api/todoApi.ts)
- [frontend/src/api/githubToolsApi.ts](/Users/lalala/Desktop/ccHub/frontend/src/api/githubToolsApi.ts)
- [frontend/src/api/systemConfigApi.ts](/Users/lalala/Desktop/ccHub/frontend/src/api/systemConfigApi.ts)

特点：

- 基本都是轻量封装，未抽象统一的请求客户端。
- `todoApi` 有统一 `handleResponse`，错误处理相对完整。
- `githubToolsApi` / `systemConfigApi` 直接各自判断 `res.ok`，风格不统一。
- `githubToolsApi` 暴露了 `API_BASE_URL`，被主页 AI 页面直接复用。
- `fetchWithAuth()` 已定义但当前没有任何地方调用，说明认证机制尚未真正落地。

## 5. 业务模块梳理

### 5.1 HomePage：AI 对话页

文件：[frontend/src/pages/HomePage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/HomePage.tsx)

主流程：

1. 用户输入问题。
2. `buildContext()` 拉取 TODO 和 GitHub 深度使用工具，拼成中文上下文。
3. `callLlm()` 将上下文和用户问题打包成单条 `user` 消息，发给 `/llm/chat`。
4. 将后端返回的 `reply` 追加到本地消息列表。

设计特点：

- 对话历史只保存在前端内存，不会持久化。
- 实际发给模型的不是多轮上下文，而是“本地拼接后的单轮 prompt”。
- 主页依赖两个业务域：TODO 与 GitHub 收藏，因此它是跨模块聚合页。

### 5.2 TodoPage：任务管理

核心文件：

- [frontend/src/pages/TodoPage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/TodoPage.tsx)
- [frontend/src/components/Todo/TodoList.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/Todo/TodoList.tsx)
- [frontend/src/components/Todo/TodoItem.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/Todo/TodoItem.tsx)
- [frontend/src/components/Todo/TodoForm.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/Todo/TodoForm.tsx)

页面职责：

- 页面组件负责远程请求、错误处理、表单开关、编辑态切换。
- 列表组件只负责遍历。
- 单项组件负责展示与触发事件。
- 表单组件负责本地输入态和提交。

主要交互：

- 初次加载：`fetchTodos()`
- 新建：`todoApi.create()`
- 编辑：`todoApi.update()`
- 删除：`todoApi.delete()`
- 勾选状态：仅在 `done` 和 `pending` 间切换，不涉及 `in_progress`

### 5.3 GithubToolsPage：GitHub 工具流转页

核心文件：

- [frontend/src/pages/GithubToolsPage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/GithubToolsPage.tsx)
- [frontend/src/components/GithubTools/ToolCard.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/GithubTools/ToolCard.tsx)
- [frontend/src/components/GithubTools/ConfigModal.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/GithubTools/ConfigModal.tsx)

页面模型：

- `unread`：展示推荐 feed
- `practiced`：展示已实践收藏
- `deep_use`：展示深度使用收藏

当前交互流：

- unread 页签拉取 `/github-tools/feed`
- 其它页签拉取 `/github-tools/collection?status=...`
- “保留”触发 `keepTool()`
- “不感兴趣”触发 `hideTool()`
- “标记为深度使用 / 不再使用”触发 `updateStatus()`
- “管理关注领域”打开配置弹窗，对应 `FocusConfig`

### 5.4 SettingsPage：LLM 配置

核心文件：

- [frontend/src/pages/SettingsPage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/SettingsPage.tsx)
- [frontend/src/components/Layout/LlmConfig.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/Layout/LlmConfig.tsx)

当前是一个纯配置页，主要管理：

- `apiUrl`
- `apiKey`
- `model`

保存后调用 `/system-config/llm` 的 `PUT` 接口。

## 6. 前端数据流与耦合关系

### 6.1 TODO 域

- 页面从 `todoApi` 拉取数据
- 表单与条目组件不直接依赖后端结构以外的状态
- 与主页 AI 页有二次耦合，因为主页会再请求 TODO 数据拼上下文

### 6.2 GitHub 工具域

- `GithubToolsPage` 同时维护 `feed` 和 `collection` 两套数据源
- 状态流转依赖后端 `CollectionStatus`
- `ConfigModal` 与主页面解耦较浅，保存后重新拉配置
- 主页 AI 页也依赖 `deep_use` 收藏列表，形成跨页复用

### 6.3 LLM 配置域

- 设置页配置由后端数据库驱动
- 主页 AI 页并不直接使用前端设置值，而是请求后端 `/llm/chat`
- 实际模型调用配置完全在后端生效，前端只是配置入口

## 7. 当前代码组织特征

优点：

- 页面边界清晰，目录分层直观。
- API、页面、组件已做基础拆分。
- 样式以 CSS Module 为主，局部污染风险较低。

限制：

- 没有统一请求层、错误模型和 loading 模型。
- 页面的副作用逻辑偏散，依赖 `useEffect` + 手工刷新。
- 类型复用不足，多个地方直接用 `any` 或重复定义接口。
- 主页 AI 页自己拼 prompt，缺少独立的“上下文构建器”抽象。

## 8. 维护建议

- 优先统一 API 客户端和错误处理方式。
- 将主页 AI 的上下文构建逻辑独立成 service/hook，避免继续耦合页面。
- 为 GitHub 工具页补齐交互测试，尤其是状态流转与卡片点击行为。
- 为设置页设计“掩码回显”和“仅修改字段提交”的一致策略，避免配置被覆盖。

