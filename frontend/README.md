# frontend

`frontend/` 是 ccHub 的 React 19 + TypeScript + Vite 单页应用。

## 页面

- `/login`：登录页
- `/`：AI 对话页，支持多轮消息和独立上下文构建
- `/todo`：TODO 管理
- `/github-tools`：GitHub 工具推荐与收藏
- `/settings`：LLM 配置

## 运行

```bash
npm install
npm run dev
```

默认端口为 `5173`。

## 前端基线

- 认证状态由 `src/features/auth/authStore.ts` 管理
- 对话状态由 `src/features/chat/chatStore.ts` 管理
- 所有远程请求通过 `src/api/client.ts` 发起
- API 基地址由 `VITE_API_URL` 控制，未设置时默认回落到 `http://localhost:4000/api/v1`

## 校验

```bash
npm run lint
npm run test
npm run build
```
