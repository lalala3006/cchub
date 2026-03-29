# GitHub Tools 页面优化设计

## 概述

对 GitHub Tools 页面进行四项优化：卡片热区、项目图标、LLM 中文总结、手动触发按钮。

---

## 1. 卡片点击热区

### 需求
整个卡片可点击，点击后跳转到 GitHub 项目页面。

### 实现方案
修改 `ToolCard.tsx` 组件：

```tsx
// 当前：卡片是展示型，用户需点击项目名称跳转
// 优化后：整个卡片包裹 <a> 标签，实现整卡可点击

<a href={tool.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
  <div className={styles.card}>
    {/* 卡片内容保持不变 */}
  </div>
</a>
```

### 文件
- `frontend/src/components/GithubTools/ToolCard.tsx`

---

## 2. 项目图标（Favicon）

### 需求
显示 GitHub 项目本身的 favicon 图标。

### 实现方案

#### 后端爬取
在 `GithubFetcherService.fetchOneTool()` 时：
1. 访问 GitHub 仓库页面 `https://github.com/{owner}/{repo}`
2. 解析 HTML 提取 `<link rel="icon">` 或 `favicon.ico`
3. 将 favicon URL 存入 `GithubTool.avatarUrl`

#### 前端展示
修改 `ToolCard.tsx`，使用 `avatarUrl` 替代当前的语言图标：

```tsx
<img
  src={tool.avatarUrl || `/languages/${tool.language?.toLowerCase()}.svg`}
  alt={tool.name}
  className={styles.avatar}
/>
```

### 数据库变更
| 字段 | 类型 | 说明 |
|------|------|------|
| `avatarUrl` | VARCHAR(500) | 项目 favicon URL |

### 文件
- `backend/src/github-tool/github-tool.entity.ts` - 新增 `avatarUrl` 字段
- `backend/src/github-tool/github-fetcher.service.ts` - 爬取 favicon
- `frontend/src/components/GithubTools/ToolCard.tsx` - 显示 avatarUrl
- `frontend/src/api/githubToolsApi.ts` - 类型定义更新

---

## 3. LLM 中文总结

### 需求
项目介绍部分通过 LLM API 生成中文总结。

### 实现方案

#### 3.1 架构设计

新增独立 `LlmService`：

```
┌─────────────────────────────────────────────────────────┐
│                      Backend                             │
│  ┌─────────────┐    ┌─────────────┐                   │
│  │ LlmService  │    │GithubFetcher│                   │
│  │             │    │  Service    │                   │
│  │ - chat()    │    │ - fetch()   │                   │
│  │ - summarize()│◄───│ - summarize │                   │
│  └──────┬──────┘    └─────────────┘                   │
│         │                                                   │
│  ┌──────▼──────┐                                         │
│  │ SystemConfig │  ← 存储 API URL/Key/Model              │
│  │   Entity     │                                        │
│  └─────────────┘                                         │
└─────────────────────────────────────────────────────────┘
```

#### 3.2 SystemConfig 实体

```typescript
// backend/src/system-config/system-config.entity.ts
@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;        // 如 'llm_api_url', 'llm_api_key', 'llm_model'

  @Column()
  value: string;

  @Column({ default: 'llm' })
  category: string;  // 配置分类
}
```

#### 3.3 LlmService 实现

```typescript
// backend/src/llm/llm.service.ts
@Injectable()
export class LlmService {
  async chat(messages: { role: string; content: string }[]): Promise<string> {
    const config = await this.getLlmConfig();
    // 后端仅内部调用，密钥不暴露到前端
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages
      })
    });
    // 解析响应...
  }

  async summarizeTool(tool: GithubTool): Promise<string> {
    const prompt = `请用中文总结以下 GitHub 项目，50 字以内：\n\n项目名：${tool.fullName}\n描述：${tool.description || '无'}\n语言：${tool.language}\nStar 数：${tool.stars}`;
    return this.chat([{ role: 'user', content: prompt }]);
  }
}
```

#### 3.4 手动触发流程（后台任务）

```
用户点击「刷新」按钮
    │
    ▼
POST /github-tools/fetch
    │
    ▼
1. 清除旧项目缓存（可选，根据需求）
2. 调用 GitHub API 获取新项目
3. 爬取每个项目的 favicon
4. 将任务加入队列
    │
    ▼
后台队列处理：
5. 逐个调用 LlmService.summarizeTool()
6. 更新项目的 descriptionCn 字段
```

#### 3.5 数据库变更

| 字段 | 类型 | 说明 |
|------|------|------|
| `descriptionCn` | TEXT | LLM 生成的中文总结 |

#### 3.6 文件
- `backend/src/llm/` - 新增 llm 模块
  - `llm.module.ts`
  - `llm.service.ts`
  - `llm.controller.ts`（可选，用于测试）
- `backend/src/system-config/` - 新增配置模块
  - `system-config.module.ts`
  - `system-config.entity.ts`
  - `system-config.service.ts`
- `backend/src/github-tool/github-tool.entity.ts` - 新增 `avatarUrl`、`descriptionCn` 字段
- `backend/src/github-tool/github-fetcher.service.ts` - 爬取 favicon
- `backend/src/github-tool/github-tool.service.ts` - 调用 LLM 生成总结

---

## 4. 手动触发按钮

### 需求
增加一个按钮，手动触发定时任务，对近期热门 GitHub 项目进行检索更新。

### 实现方案

#### 前端
在 `GithubToolsPage.tsx` Feed 区域顶部添加刷新按钮：

```tsx
<Button
  icon={<ReloadOutlined />}
  onClick={handleManualFetch}
  loading={fetching}
>
  刷新项目
</Button>
```

#### 后端接口
现有接口 `POST /github-tools/fetch` 已实现，改为支持完整流程（获取项目 → 队列生成总结）。

### 文件
- `frontend/src/pages/GithubToolsPage.tsx` - 添加刷新按钮
- `frontend/src/api/githubToolsApi.ts` - 添加 `fetchTools` API
- `backend/src/github-tool/github-tool.controller.ts` - 确认接口

---

## 5. LLM 配置组件

### 需求
在 Layout Footer 中添加 LLM 配置组件。

### 实现方案

#### Layout Footer 结构
```
┌─────────────────────────────────────────────────────────┐
│  Footer                                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ LLM 配置 [展开/收起]                              │   │
│  │   API URL: [________________]                     │   │
│  │   API Key:  [________________]  (密码输入)         │   │
│  │   Model:    [________________]                    │   │
│  │              [保存配置]                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### 组件实现
```tsx
// frontend/src/components/Layout/LlmConfig.tsx
export const LlmConfig: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [form] = Form.useForm();

  const handleSave = async (values: LlmConfigForm) => {
    await systemConfigApi.updateLlmConfig(values);
    message.success('配置已保存');
  };

  return (
    <div className={styles.llmConfig}>
      <div onClick={() => setCollapsed(!collapsed)}>
        LLM 配置 {collapsed ? '▼' : '▲'}
      </div>
      {!collapsed && (
        <Form form={form} onFinish={handleSave}>
          <Form.Item name="apiUrl" label="API URL">
            <Input />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key">
            <Input.Password />
          </Form.Item>
          <Form.Item name="model" label="模型">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit">保存配置</Button>
        </Form>
      )}
    </div>
  );
};
```

#### API 接口
| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/system-config/llm` | 获取 LLM 配置 |
| PUT | `/system-config/llm` | 更新 LLM 配置 |

#### 文件
- `frontend/src/components/Layout/LlmConfig.tsx` - 新增
- `frontend/src/components/Layout/Layout.tsx` - Footer 中引入
- `frontend/src/api/systemConfigApi.ts` - 新增
- `backend/src/system-config/system-config.controller.ts` - 新增
- `backend/src/system-config/system-config.service.ts` - 新增

---

## 6. 安全考虑

### API 密钥保护
- LLM API Key 仅存储在数据库和后端内存中
- 前端仅传输加密后的配置，不传输明文密钥
- 所有 LLM 调用由后端服务发起，前端不直接调用 LLM API

### 防护措施
- API Key 在前端显示为密码输入框
- 后端存储时可选择加密（可选增强）

---

## 7. 文件清单

### 新增文件
| 文件 | 说明 |
|------|------|
| `backend/src/llm/llm.module.ts` | LLM 模块 |
| `backend/src/llm/llm.service.ts` | LLM 服务 |
| `backend/src/system-config/system-config.module.ts` | 系统配置模块 |
| `backend/src/system-config/system-config.entity.ts` | 配置实体 |
| `backend/src/system-config/system-config.service.ts` | 配置服务 |
| `backend/src/system-config/system-config.controller.ts` | 配置接口 |
| `frontend/src/components/Layout/LlmConfig.tsx` | LLM 配置组件 |
| `frontend/src/api/systemConfigApi.ts` | 配置 API |

### 修改文件
| 文件 | 说明 |
|------|------|
| `backend/src/github-tool/github-tool.entity.ts` | 新增 `avatarUrl`、`descriptionCn` |
| `backend/src/github-tool/github-fetcher.service.ts` | 爬取 favicon |
| `backend/src/github-tool/github-tool.service.ts` | 调用 LLM 生成总结 |
| `backend/src/github-tool/github-tool.module.ts` | 引入新模块 |
| `frontend/src/components/GithubTools/ToolCard.tsx` | 整卡可点击、显示 favicon |
| `frontend/src/pages/GithubToolsPage.tsx` | 添加刷新按钮 |
| `frontend/src/api/githubToolsApi.ts` | 更新类型定义 |
| `frontend/src/components/Layout/Layout.tsx` | 引入 LlmConfig |
| `frontend/src/components/Layout/Layout.module.css` | 样式调整 |

### 数据库迁移
```sql
ALTER TABLE github_tool ADD COLUMN avatarUrl VARCHAR(500);
ALTER TABLE github_tool ADD COLUMN descriptionCn TEXT;

CREATE TABLE system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'llm',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 8. 测试计划

1. **卡片点击**：验证整卡可点击，点击后正确跳转
2. **Favicon 显示**：验证项目卡片显示正确的 favicon
3. **LLM 配置**：验证配置保存和加载功能
4. **手动刷新**：验证刷新按钮触发完整流程（获取项目 → 生成总结）
5. **安全验证**：确认 API Key 不在网络请求或前端代码中暴露
