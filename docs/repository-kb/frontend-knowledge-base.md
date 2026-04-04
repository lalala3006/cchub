# 前端知识库

## 1. 定位

`frontend/` 是一个基于 React 19 + TypeScript + Vite 的单页应用，当前承担：

- `/login`：登录入口
- `/`：AI 对话助手
- `/todo`：TODO 管理
- `/github-tools`：GitHub 工具推荐与收藏流转
- `/settings`：LLM 配置

这次重构后，前端的核心变化是：

- 引入共享 auth store 管理登录态
- 引入共享 chat store 管理多轮消息
- 引入统一 API client 处理 base URL、鉴权和错误模型
- 将首页上下文拼装提取为独立 context builder

## 2. 技术栈与运行方式

- 路由：`react-router-dom`
- UI 组件：`antd`
- 构建：Vite
- API 通信：`src/api/client.ts` 基于浏览器原生 `fetch` 的统一封装

开发态默认请求 `http://localhost:4000/api/v1`，容器部署时可通过
`VITE_API_URL=/api/v1` 走同域代理。

## 3. 路由与应用壳

入口见 [frontend/src/App.tsx](/Users/lalala/Desktop/ccHub/frontend/src/App.tsx)。

- 未登录时进入 [frontend/src/pages/LoginPage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/LoginPage.tsx)
- 登录后进入 [frontend/src/components/Layout/Layout.tsx](/Users/lalala/Desktop/ccHub/frontend/src/components/Layout/Layout.tsx)

`AppProviders` 位于
[frontend/src/app/AppProviders.tsx](/Users/lalala/Desktop/ccHub/frontend/src/app/AppProviders.tsx)，
负责启动时恢复会话和注册 401 回收逻辑。

## 4. 状态与 API 设计

### 4.1 全局状态

- [frontend/src/features/auth/authStore.ts](/Users/lalala/Desktop/ccHub/frontend/src/features/auth/authStore.ts)
  管理当前用户、token、bootstrap 状态
- [frontend/src/features/chat/chatStore.ts](/Users/lalala/Desktop/ccHub/frontend/src/features/chat/chatStore.ts)
  管理多轮消息、发送态和错误态
- 轻量 store 基座在
  [frontend/src/app/createStore.ts](/Users/lalala/Desktop/ccHub/frontend/src/app/createStore.ts)

### 4.2 API 层

统一 client 位于
[frontend/src/api/client.ts](/Users/lalala/Desktop/ccHub/frontend/src/api/client.ts)。

职责：

- 计算 `API_BASE_URL`
- 自动附带 `Authorization`
- 统一解析错误 envelope
- 遇到 401 时触发全局登录态回收

领域 API 文件仍保留，但只暴露业务方法：

- [frontend/src/api/todoApi.ts](/Users/lalala/Desktop/ccHub/frontend/src/api/todoApi.ts)
- [frontend/src/api/githubToolsApi.ts](/Users/lalala/Desktop/ccHub/frontend/src/api/githubToolsApi.ts)
- [frontend/src/api/systemConfigApi.ts](/Users/lalala/Desktop/ccHub/frontend/src/api/systemConfigApi.ts)
- [frontend/src/features/auth/authApi.ts](/Users/lalala/Desktop/ccHub/frontend/src/features/auth/authApi.ts)

## 5. 业务模块梳理

### 5.1 HomePage

文件：

- [frontend/src/pages/HomePage.tsx](/Users/lalala/Desktop/ccHub/frontend/src/pages/HomePage.tsx)
- [frontend/src/features/chat/contextBuilder.ts](/Users/lalala/Desktop/ccHub/frontend/src/features/chat/contextBuilder.ts)

当前流程：

1. 用户输入消息
2. `contextBuilder` 拉取 TODO 和深度使用 GitHub 工具，生成上下文快照
3. 页面把 `system + 历史消息 + 当前消息` 发送给 `/llm/chat`
4. 回复追加到共享 chat store

### 5.2 TodoPage

页面仍负责列表拉取与 CRUD 交互，但远程请求已经统一走 `todoApi`，错误提示统一由共享错误模型驱动。

### 5.3 GithubToolsPage

页面仍负责 unread / practiced / deep_use 三个视图切换，但请求、错误、鉴权都已收敛到共享 client。

### 5.4 SettingsPage

LLM 配置页保留原入口，但已通过“掩码只读、空值不覆盖”的契约避免误写 secret。

## 6. 当前组织特征

优点：

- 共享会话、对话与请求层已经形成
- 页面边界仍然清晰
- 旧页面路由和用户动作保持不变

剩余限制：

- TODO 与 GitHub 域的远程状态仍主要由页面本地副作用管理
- chat store 目前只做内存态，不做跨刷新持久化

## 7. 维护建议

- 若后续引入更复杂权限，优先扩展 auth store 和 `/auth/me` 契约
- 若后续需要更强缓存/失效策略，再在统一 client 之上扩展数据层
