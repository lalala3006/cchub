# frontend

前端是一个基于 React + TypeScript + Vite 的单页应用。

## 页面

- `/`：AI 对话页
- `/todo`：TODO 管理
- `/github-tools`：GitHub 工具推荐与收藏
- `/settings`：LLM 配置

## 开发

```bash
npm install
npm run dev
```

默认端口为 `5173`。开发环境下 `/api` 会代理到 `http://localhost:4000`。

## 校验

```bash
npm run lint
npm run build
```

## 说明

- API 基地址由 `VITE_API_URL` 控制
- 未设置时默认回落到 `http://localhost:4000/api/v1`
