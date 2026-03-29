# GitHub 工具收藏模块设计

## 概述

每周自动抓取 GitHub 热门项目，按用户关注的领域和权重筛选，展示在网站中。用户可对项目进行反馈（保留/隐藏），并跟踪学习状态。

## 技术栈

- **前端**: React + TypeScript + Antd
- **后端**: NestJS + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **定时任务**: NestJS Schedule

---

## 数据库设计

### `github_tool` 表（每周搜集的原始数据）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 项目名 |
| full_name | TEXT | owner/repo 格式，唯一 |
| url | TEXT | GitHub 地址 |
| description | TEXT | 项目描述 |
| stars | INTEGER | star 数 |
| language | TEXT | 主要语言 |
| fetched_at | DATETIME | 抓取时间 |
| created_at | DATETIME | 入库时间 |

### `collection_record` 表（用户收藏记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| tool_id | INTEGER | 关联 github_tool.id |
| status | TEXT | unread / practiced / deep_use / no_longer_used |
| is_hidden | BOOLEAN | 是否被隐藏（不感兴趣） |
| status_changed_at | DATETIME | 状态变更时间 |
| created_at | DATETIME | 入库时间 |

### `focus_config` 表（关注领域配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| keyword | TEXT | 搜索关键词 |
| weight | INTEGER | 权重 1-10 |
| created_at | DATETIME | 创建时间 |

---

## API 设计

### 工具推荐

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/github-tools/feed` | 获取本周推荐（去重、排除已隐藏） |
| POST | `/api/v1/github-tools/fetch` | 手动触发抓取（定时调用） |

### 收藏管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/github-tools/collection` | 按状态查询收藏（支持 search 参数） |
| POST | `/api/v1/github-tools/collection/:toolId/keep` | 保留到收藏（状态变为 practiced） |
| POST | `/api/v1/github-tools/collection/:toolId/hide` | 隐藏（不感兴趣，彻底屏蔽） |
| PATCH | `/api/v1/github-tools/collection/:toolId/status` | 更新状态（顺序流转） |

### 配置管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/github-tools/config` | 获取关注领域配置 |
| POST | `/api/v1/github-tools/config` | 添加关注领域 |
| DELETE | `/api/v1/github-tools/config/:id` | 删除关注领域 |
| PATCH | `/api/v1/github-tools/config/:id` | 更新权重 |

---

## 状态流转

```
unread → practiced → deep_use → no_longer_used
```

- 只能按顺序流转，不可跳级
- 可在不同时间多次修改
- deep_use 项目永久保留
- 其他状态只保留近半年（自动清理）

---

## 定时任务

**执行时间**: 每周日凌晨 2:00

**抓取策略（混合方案）**:
1. 按关注领域权重分配配额（10个名额，权重高得多抓）
2. 优先使用 GitHub Search API 按关键词+时间排序
3. 不足部分用 GitHub Trending 页面补充
4. 过滤掉已收藏和已隐藏的项目
5. 存入 `github_tool`，状态为 `unread`

---

## 前端页面

### 入口

右上角圆形图标按钮，点击弹出配置弹窗或跳转到 `/github-tools` 页面

### 主页面 `/github-tools`

- 三个 Tab：未读、已实践、深度使用
- 每个 Tab 内有搜索框（按项目名/描述检索）
- 卡片展示：项目名、star 数、描述、语言
- 未读 Tab 操作：保留(keep) / 隐藏(hide)
- 已实践 Tab 操作：标记为深度使用
- 深度使用 Tab 操作：标记为不再使用

### 配置弹窗（Antd Modal）

- 表单：关键词输入 + 权重滑块（1-10）
- 列表展示已有领域，可编辑/删除
- 保存后触发重新抓取

---

## 数据清理

- 状态为 `unread` / `practiced` / `no_longer_used` 且 `status_changed_at` 超过 6 个月，自动删除
- `deep_use` 状态永久保留
- `is_hidden` 的项目彻底屏蔽，不在推荐中出现
