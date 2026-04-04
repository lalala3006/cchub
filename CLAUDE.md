# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ccHub is a full-stack personal tool management application with a React frontend and a NestJS backend. The current baseline includes:

- login-protected business pages
- TODO management
- GitHub tool discovery and collection workflow
- an LLM-backed chat home page with multi-turn prompt context
- SQLite schema managed by TypeORM migrations, not `synchronize`

## Knowledge Base Index

Read these before making broad changes:

- Project overview and local run instructions:
  [README.md](README.md)
- Repository knowledge index:
  [docs/repository-kb/README.md](docs/repository-kb/README.md)
- Frontend knowledge base:
  [docs/repository-kb/frontend-knowledge-base.md](docs/repository-kb/frontend-knowledge-base.md)
- Backend knowledge base:
  [docs/repository-kb/backend-knowledge-base.md](docs/repository-kb/backend-knowledge-base.md)
- Refactor spec artifacts:
  [spec.md](specs/001-architecture-refactor/spec.md),
  [plan.md](specs/001-architecture-refactor/plan.md),
  [tasks.md](specs/001-architecture-refactor/tasks.md)

Recommended reading order:

1. Read the repository knowledge index.
2. Read the relevant frontend or backend knowledge base.
3. Open only the source files linked from those documents.

## Commands

### Backend (NestJS + TypeScript + SQLite)

```bash
cd backend
npm install          # Install dependencies
npm run migration:run # Apply migrations
npm run build       # Compile TypeScript to dist/
npm run start       # Run production server (dist/main.js)
npm run start:dev   # Run with ts-node (hot reload)
npm test            # Run Jest tests
npm test:watch      # Run tests in watch mode
npm test:cov        # Run tests with coverage
```

- API runs on `http://localhost:4000/api/v1`
- SQLite database at `backend/database.sqlite` (or path in `DATABASE_PATH` env var)
- Default local login: `admin / admin123456`
- Test pattern: `*.spec.ts` files in `src/`

### Frontend (React + TypeScript + Vite)

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server (hot reload)
npm run build        # Production build (TypeScript check + Vite build)
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
```

- Frontend dev server on `http://localhost:5173` (proxies `/api` to backend)
- Test pattern: `*.spec.{ts,tsx}` and `*.test.{ts,tsx}` files

### Docker

```bash
docker-compose up -d --build   # Build and start all services
docker-compose ps              # Show running containers
docker-compose logs -f         # View logs
docker-compose down            # Stop services
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Architecture

### Frontend Structure

```
frontend/src/
├── App.tsx                    # Route configuration and auth gating
├── main.tsx                   # Entry point
├── api/                       # Shared HTTP client + domain API wrappers
├── app/                       # AppProviders + lightweight store base
├── components/                # Reusable layout and feature components
├── features/
│   ├── auth/                  # Login API + auth store
│   └── chat/                  # Chat store + prompt context builder
├── pages/                     # Route-level pages
└── test/setup.ts              # Vitest setup
```

Routes: `/login`, `/`, `/todo`, `/github-tools`, `/settings`

Important entrypoints:

- [frontend/src/App.tsx](frontend/src/App.tsx)
- [frontend/src/api/client.ts](frontend/src/api/client.ts)
- [frontend/src/features/auth/authStore.ts](frontend/src/features/auth/authStore.ts)
- [frontend/src/features/chat/contextBuilder.ts](frontend/src/features/chat/contextBuilder.ts)

### Backend Structure

```
backend/src/
├── main.ts                    # Bootstrap: CORS, prefix /api/v1, global pipes and filters
├── app.module.ts              # Root module + global auth guard
├── auth/                      # Login, current user, token verification
├── common/                    # Unified error model and filters
├── database/                  # TypeORM config and migrations
├── todo/                      # TODO feature module
├── github-tool/               # GitHub tools module and split services
├── llm/                       # Multi-turn chat endpoint
└── system-config/             # Typed KV config storage
```

### Backend Modules

| Module | Purpose |
|--------|---------|
| `AuthModule` | Login, current user lookup, and route protection |
| `TodoModule` | CRUD operations for TODO items |
| `GithubToolModule` | GitHub repository tools and collection management |
| `LlmModule` | LLM integration |
| `SystemConfigModule` | System configuration storage |

### Database

- SQLite via `better-sqlite3` with TypeORM
- TypeORM options centralized in `backend/src/database/typeorm.config.ts`
- Schema evolves through migrations
- `synchronize: false`

### API Prefix

All API routes prefixed with `/api/v1` (e.g., `/api/v1/todos`, `/api/v1/github-tools`)

### Auth and Error Handling

- `POST /api/v1/auth/login` is public
- Business routes require `Authorization: Bearer <token>`
- Errors are normalized by `HttpExceptionFilter`
- Missing auth returns `AUTH_REQUIRED`

Important backend entrypoints:

- [backend/src/main.ts](backend/src/main.ts)
- [backend/src/app.module.ts](backend/src/app.module.ts)
- [backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts)
- [backend/src/database/typeorm.config.ts](backend/src/database/typeorm.config.ts)
- [backend/src/common/filters/http-exception.filter.ts](backend/src/common/filters/http-exception.filter.ts)
