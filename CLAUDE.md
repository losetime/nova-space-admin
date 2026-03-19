# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nova Space Admin is a monorepo containing an admin dashboard for managing space education articles and intelligence content. It consists of:
- **backend-nest**: NestJS backend API (port 3002)
- **frontend**: Vue 3 admin dashboard (port 5180)

The admin system shares a PostgreSQL database with a main application (nova-space on port 3001). Database schema is managed by the main project - this admin system uses `synchronize: false`.

## Common Commands

### Backend (from backend-nest/)
```bash
pnpm install          # Install dependencies
pnpm run start:dev    # Development server with hot reload
pnpm run build        # Build for production
pnpm run lint         # Run ESLint
pnpm run test         # Run unit tests
pnpm run test:e2e     # Run e2e tests
npx ts-node scripts/create-admin.ts  # Create/update admin user (admin/admin123)
```

### Frontend (from frontend/)
```bash
pnpm install    # Install dependencies
pnpm run dev    # Development server
pnpm run build  # Build for production
```

## Architecture

### Backend Structure
- `src/modules/` - Feature modules (article, intelligence, auth, import)
- `src/common/` - Shared utilities (entities, guards, filters, interceptors)
- `src/config/` - Configuration using @nestjs/config

Each module follows NestJS conventions:
- `*.module.ts` - Module definition
- `*.controller.ts` - REST endpoints
- `*.service.ts` - Business logic
- `entities/*.entity.ts` - TypeORM entities
- `dto/*.dto.ts` - Data transfer objects with class-validator

### Frontend Structure
- `src/views/` - Page components (ArticlesView, IntelligenceView, DashboardView, LoginView)
- `src/components/layout/` - Layout components (AdminLayout with sidebar)
- `src/stores/` - Pinia stores (auth store for authentication state)
- `src/api/` - Axios API client with request/response interceptors
- `src/router/` - Vue Router with auth guards

### Key Entities
- **Article** (`education_articles`): Education content with categories: basic, advanced, mission, people
- **Intelligence** (`intelligences`): Space intelligence with categories: launch, satellite, industry, research, environment; levels: free, advanced, professional
- **User** (`users`): Users with roles: user, admin, super_admin

### Authentication
- JWT-based authentication with Passport
- Token stored in localStorage as `admin_token`
- Frontend API interceptor adds Bearer token to requests
- Backend uses JwtAuthGuard and AdminGuard for protected routes

### API Patterns
- All API routes prefixed with `/api`
- Responses wrapped in `{ success, data, message }` format via TransformInterceptor
- Errors handled globally via AllExceptionsFilter
- Pagination returns `{ data, total, page, limit, totalPages }`

### Import Feature
The import module supports CSV and Excel file uploads for batch importing articles and intelligence data. Files are parsed and validated before batch insertion.