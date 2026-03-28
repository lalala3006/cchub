# ccHub - 个人工具管理网站

一个简单但完整的全栈 TODO List 应用，展示现代化 Web 开发架构。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React + TypeScript + Vite | 单页应用，组件化开发 |
| 后端 | NestJS + TypeScript | 模块化 REST API |
| 数据库 | SQLite (better-sqlite3) | 轻量级文件数据库 |
| 部署 | Docker Compose | 容器化部署 |

## 项目结构

```
ccHub/
├── frontend/                 # 前端 React 应用
│   ├── src/
│   │   ├── App.tsx         # 路由配置
│   │   ├── main.tsx        # 入口文件
│   │   ├── api/
│   │   │   └── todoApi.ts  # API 调用层
│   │   ├── components/
│   │   │   ├── Layout/     # 布局组件
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── Todo/       # TODO 相关组件
│   │   │       ├── TodoList.tsx
│   │   │       ├── TodoItem.tsx
│   │   │       └── TodoForm.tsx
│   │   └── pages/
│   │       └── TodoPage.tsx
│   ├── nginx.conf          # Nginx 配置 (代理 /api 到后端)
│   └── Dockerfile          # 前端构建镜像
│
├── backend/                  # 后端 NestJS 应用
│   ├── src/
│   │   ├── main.ts         # 入口，启动配置
│   │   ├── app.module.ts   # 根模块
│   │   └── todo/
│   │       ├── todo.module.ts      # TODO 模块
│   │       ├── todo.controller.ts  # 路由处理
│   │       ├── todo.service.ts      # 业务逻辑
│   │       ├── todo.entity.ts       # 数据库实体
│   │       └── dto/                 # 数据传输对象
│   │           ├── create-todo.dto.ts
│   │           └── update-todo.dto.ts
│   ├── Dockerfile
│   └── tsconfig.json
│
├── docker-compose.yml        # 容器编排
└── README.md
```

---

## 一、前端架构 (React + TypeScript)

### 1.1 路由层

`App.tsx` 使用 React Router v7 配置路由：

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Navigate to="/todo" replace />} />
      <Route path="todo" element={<TodoPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

- `/` → 重定向到 `/todo`
- `/todo` → 渲染 TodoPage

### 1.2 布局层

`Layout.tsx` 实现侧边栏 + 内容区的经典后台管理布局：

```tsx
<div className={styles.layout}>
  <Sidebar />           // 左侧菜单
  <main className={styles.mainContent}>
    <Outlet />          // 右侧动态内容
  </main>
</div>
```

`<Outlet />` 是 React Router 提供的占位组件，根据路由动态渲染子页面。

### 1.3 页面层

`TodoPage.tsx` 是 TODO 功能的主页面，负责：

- **状态管理**：todos 列表、loading 状态、error 信息
- **业务逻辑**：CRUD 操作的发起和处理
- **UI 渲染**：列表、表单、条件展示

```tsx
// 核心状态
const [todos, setTodos] = useState<Todo[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [showForm, setShowForm] = useState(false);
const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
```

### 1.4 API 层

`todoApi.ts` 封装所有 API 调用：

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const todoApi = {
  async getAll(): Promise<Todo[]> { ... },
  async create(data: CreateTodoInput): Promise<Todo> { ... },
  async update(id: number, data: UpdateTodoInput): Promise<Todo> { ... },
  async delete(id: number): Promise<void> { ... },
};
```

**类型定义：**
```typescript
export interface Todo {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'done';
  createdAt: string;
  updatedAt: string;
}
```

---

## 二、后端架构 (NestJS)

### 2.1 入口配置

`main.ts` 是后端启动入口：

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();                      // 允许跨域
  app.setGlobalPrefix('api/v1');        // 所有路由加前缀
  app.useGlobalPipes(new ValidationPipe({ transform: true })); // 自动验证

  await app.listen(4000);
}
```

**关键配置说明：**
| 配置 | 作用 |
|------|------|
| `enableCors()` | 允许前端 (localhost:3000) 跨域访问 API |
| `setGlobalPrefix('api/v1')` | 所有路由变为 `/api/v1/todos` 等形式 |
| `ValidationPipe` | 自动验证请求体，转换数据类型 |

### 2.2 模块系统

NestJS 使用模块组织代码。`AppModule` 是根模块：

```typescript
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH || './database.sqlite',
      entities: [Todo],
      synchronize: true,  // 开发环境自动同步表结构
    }),
    TodoModule,
  ],
})
export class AppModule {}
```

`TodoModule` 聚合了 TODO 相关的 controller、service、entity：

```typescript
@Module({
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}
```

### 2.3 控制器层

`todo.controller.ts` 定义 REST API 路由：

```typescript
@Controller('todos')
export class TodoController {
  @Get()        findAll() { ... }
  @Post()       create(@Body() dto) { ... }
  @Get(':id')   findOne(@Param('id', ParseIntPipe) id) { ... }
  @Patch(':id') update(@Param('id', ParseIntPipe) id, @Body() dto) { ... }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id) { ... }
}
```

**路由映射：**
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/v1/todos` | 获取所有 TODO |
| POST | `/api/v1/todos` | 创建 TODO |
| GET | `/api/v1/todos/:id` | 获取单个 TODO |
| PATCH | `/api/v1/todos/:id` | 更新 TODO |
| DELETE | `/api/v1/todos/:id` | 删除 TODO |

**`ParseIntPipe`**：自动将 URL 参数 `:id` 从字符串转换为数字。

### 2.4 服务层

`todo.service.ts` 包含业务逻辑：

```typescript
@Injectable()
export class TodoService {
  constructor(@InjectRepository(Todo) private repo: Repository<Todo>) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC', createdAt: 'DESC' } });
  }

  create(dto) {
    const todo = this.repo.create(dto);
    return this.repo.save(todo);
  }

  async update(id, dto) {
    const todo = await this.findOne(id);
    Object.assign(todo, dto);
    return this.repo.save(todo);
  }
}
```

### 2.5 实体层

`todo.entity.ts` 使用 TypeORM 装饰器定义数据库表：

```typescript
@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'pending' })
  status: TodoStatus;

  @Column({ default: 'medium' })
  priority: TodoPriority;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 三、前后端联通配置

### 3.1 API 调用路径

```
前端请求                          后端处理
   │                                │
   ▼                                ▼
fetch('/api/v1/todos') ────► NestJS 路由匹配
                                     │
                                     ▼
                              @Get() findAll()
                                     │
                                     ▼
                              TodoService.findAll()
                                     │
                                     ▼
                              SQLite 数据库
```

### 3.2 关键配置对照表

| 配置位置 | 配置内容 | 说明 |
|----------|----------|------|
| `frontend/src/api/todoApi.ts` | `VITE_API_URL` | 构建时确定的 API 基础路径 |
| `backend/src/main.ts` | `setGlobalPrefix('api/v1')` | API 路径前缀 |
| `backend/src/main.ts` | `enableCors()` | 允许跨域 |
| `frontend/nginx.conf` | `proxy_pass http://backend:4000` | Docker 内网代理 |

### 3.3 Docker 网络请求流程

```
浏览器
    │
    │ http://112.124.38.110:3000
    ▼
Frontend Container (:3000)
    │
    │ /api/* 转发
    ▼
Backend Container (:4000)
    │
    ▼
NestJS Controller
    │
    ▼
SQLite Database
```

### 3.4 环境变量

**前端构建时 (Docker):**
```dockerfile
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
```

**后端运行时 (Docker Compose):**
```yaml
environment:
  - DATABASE_PATH=/app/database.sqlite
```

---

## 四、数据库

### Todo 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| title | TEXT | TODO 标题 |
| description | TEXT | 描述（可空） |
| status | TEXT | pending / in_progress / done |
| priority | TEXT | low / medium / high |
| order | INTEGER | 排序权重 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

---

## 五、本地开发

### 5.1 环境要求

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**

### 5.2 克隆项目

```bash
git clone https://github.com/lalala3006/cchub.git
cd cchub
```

### 5.3 启动后端

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动开发服务器 (热重载)
npm run start:dev

# 后端启动后运行在 http://localhost:4000
# API 地址: http://localhost:4000/api/v1
```

### 5.4 启动前端

新开一个终端窗口：

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (热重载)
npm run dev

# 前端启动后运行在 http://localhost:5173 (或 5174 如果端口被占用)
```

### 5.5 访问应用

打开浏览器访问 http://localhost:5173（或终端显示的端口）

### 5.6 数据库

SQLite 数据库文件位于 `backend/database.sqlite`，无需额外配置。

---

## 六、Docker 部署

```bash
# 构建并启动
docker-compose up -d --build

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 6.2 阿里云 ECS 部署步骤

1. 在 ECS 上安装 Docker 和 docker-compose
2. 克隆代码或通过 scp 传输
3. 配置安全组，开放 3000 和 4000 端口
4. 执行 `docker-compose up -d --build`

---

## 七、API 文档

### 创建 TODO

```bash
curl -X POST http://localhost:4000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"新任务","priority":"high"}'
```

### 获取列表

```bash
curl http://localhost:4000/api/v1/todos
```

### 更新状态

```bash
curl -X PATCH http://localhost:4000/api/v1/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

### 删除

```bash
curl -X DELETE http://localhost:4000/api/v1/todos/1
```
