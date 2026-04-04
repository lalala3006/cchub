# 代码 Review

## 结论

仓库整体已经形成了可运行的前后端分层，但当前存在几处会直接影响业务正确性的实现问题，主要集中在 GitHub 工具流转、LLM 配置回写、以及 AI 上下文构造的契约不一致上。另外，文档与测试已经明显滞后于代码演进。

## 发现

### P1：GitHub 工具卡片的操作按钮包在外层链接里，点击“保留/不感兴趣/状态流转”会同时触发跳转

位置：

- [frontend/src/components/GithubTools/ToolCard.tsx#L38](/Users/lalala/Desktop/ccHub/frontend/src/components/GithubTools/ToolCard.tsx#L38)
- [frontend/src/components/GithubTools/ToolCard.tsx#L68](/Users/lalala/Desktop/ccHub/frontend/src/components/GithubTools/ToolCard.tsx#L68)
- [frontend/src/components/GithubTools/ToolCard.tsx#L84](/Users/lalala/Desktop/ccHub/frontend/src/components/GithubTools/ToolCard.tsx#L84)

问题：

- 整张卡片是 `<a>`
- 按钮在链接内部，且 `onClick` 没有 `preventDefault()` / `stopPropagation()`

影响：

- 用户点击按钮时会同时打开 GitHub 页面
- 在弱网或浏览器切标签行为下，当前页的状态更新请求可能中断或造成误判
- 实际体验会非常像“按钮失效但跳走了”

### P1：已“保留”的工具不会从 unread/feed 中移除，前后端对 unread 语义不一致

位置：

- [backend/src/github-tool/github-tool.service.ts#L19](/Users/lalala/Desktop/ccHub/backend/src/github-tool/github-tool.service.ts#L19)
- [backend/src/github-tool/github-tool.service.ts#L56](/Users/lalala/Desktop/ccHub/backend/src/github-tool/github-tool.service.ts#L56)
- [frontend/src/pages/GithubToolsPage.tsx#L57](/Users/lalala/Desktop/ccHub/frontend/src/pages/GithubToolsPage.tsx#L57)

问题：

- `keepTool()` 会把记录状态改成 `practiced`
- 但 `getFeed()` 只排除了 `isHidden = true` 的工具，没有排除已进入收藏流转的工具
- 前端又把 `unread` 页签直接绑定到 `feed`

影响：

- 用户点击“保留”后，项目仍可能继续出现在“未读”页签
- UI 上看起来像状态流转成功，但列表没有按预期收敛
- 后续容易引发重复操作和状态理解混乱

### P1：LLM 配置读取时返回掩码 key，但保存时会把掩码值原样写回数据库

位置：

- [backend/src/system-config/system-config.service.ts#L19](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.service.ts#L19)
- [backend/src/system-config/system-config.service.ts#L42](/Users/lalala/Desktop/ccHub/backend/src/system-config/system-config.service.ts#L42)
- [frontend/src/components/Layout/LlmConfig.tsx#L27](/Users/lalala/Desktop/ccHub/frontend/src/components/Layout/LlmConfig.tsx#L27)
- [frontend/src/components/Layout/LlmConfig.tsx#L36](/Users/lalala/Desktop/ccHub/frontend/src/components/Layout/LlmConfig.tsx#L36)

问题：

- 后端 `GET /system-config/llm` 返回的是掩码后的 `apiKey`
- 前端表单加载后会把这个掩码值写进表单
- 用户如果只改 `apiUrl` 或 `model`，提交时仍会把掩码后的 `apiKey` 一并发送
- 后端 `updateLlmConfig()` 不区分“掩码占位值”和“真实新值”，直接 upsert

影响：

- 一次普通的配置编辑就可能把真实密钥覆盖成 `sk***xx` 这类无效字符串
- 覆盖后所有 LLM 请求都会失败

### P1：主页构造 AI 上下文时使用了不存在的 `todo.completed` 字段，TODO 完成状态会全部失真

位置：

- [frontend/src/pages/HomePage.tsx#L71](/Users/lalala/Desktop/ccHub/frontend/src/pages/HomePage.tsx#L71)
- [frontend/src/pages/HomePage.tsx#L75](/Users/lalala/Desktop/ccHub/frontend/src/pages/HomePage.tsx#L75)
- [frontend/src/api/todoApi.ts](/Users/lalala/Desktop/ccHub/frontend/src/api/todoApi.ts)

问题：

- TODO 实体实际使用 `status`
- 主页 AI 上下文却按 `todo.completed` 判断是否完成

影响：

- 除非后端额外返回了 `completed` 字段，否则 AI 总会把任务描述成“未完成”
- 主页对话是跨模块聚合入口，这会直接污染用户对 AI 输出的信任

### P2：前端 lint 与代码当前状态不一致，说明可维护性在下降

验证：

- `frontend` 执行 `npm run lint` 失败

位置示例：

- [frontend/src/components/Layout/LlmConfig.tsx#L21](/Users/lalala/Desktop/ccHub/frontend/src/components/Layout/LlmConfig.tsx#L21)
- [frontend/src/components/Todo/TodoForm.tsx#L17](/Users/lalala/Desktop/ccHub/frontend/src/components/Todo/TodoForm.tsx#L17)
- [frontend/src/pages/HomePage.tsx#L74](/Users/lalala/Desktop/ccHub/frontend/src/pages/HomePage.tsx#L74)

问题：

- 有未使用变量
- 有 `any`
- 有空 `catch {}`
- 有 `useEffect` 依赖缺失
- 有 `set-state-in-effect` 规则报错

影响：

- 这些问题不一定都导致线上 bug，但会显著降低后续重构的确定性

### P2：后端测试已经和实现脱节，当前 `backend` 测试套件并不全绿

验证：

- `backend` 执行 `npm test -- --runInBand` 失败

位置：

- [backend/src/github-tool/github-fetcher.service.spec.ts#L187](/Users/lalala/Desktop/ccHub/backend/src/github-tool/github-fetcher.service.spec.ts#L187)

问题：

- 测试仍在 mock `fetchFavicon`
- 但当前实现中已经没有这个方法，而是改成了 README 解析流程

影响：

- 测试无法再作为重构保护网
- 也说明抓取逻辑已有改动，但配套文档与测试没有同步

### P3：仓库主 README 和前端 README 都明显过期，不能再作为可信入口文档

位置：

- [README.md](/Users/lalala/Desktop/ccHub/README.md)
- [frontend/README.md](/Users/lalala/Desktop/ccHub/frontend/README.md)

问题：

- 根 README 仍把仓库描述成单一 Todo 应用
- 前端 README 还是 Vite 模板默认文案

影响：

- 新人或未来自己回来看仓库时，很容易基于错误认知继续开发

## 验证记录

已执行：

- `frontend: npm run build`，通过
- `frontend: npm run lint`，失败
- `backend: npm test -- --runInBand`，失败

补充观察：

- 前端生产构建产物主 chunk 约 `621.88 kB`，已有 chunk 过大告警
- 当前仓库工作区较脏，包含 dist、sqlite、node_modules 及若干未提交文件，review 时已尽量避开这些噪音

## 建议的下一步

1. 先修复 P1 级问题，尤其是 LLM 密钥回写和 GitHub 工具状态语义。
2. 再清理 lint/test 漂移，让 CI 能重新提供最基本的回归保护。
3. 最后把根 README 与本次知识库合并收敛，形成仓库级单一真相来源。
