# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

星瞰 Admin 是一个 monorepo，包含：
- **backend-nest**: NestJS 后端 API（端口 3002）
- **frontend**: Vue 3 管理后台（端口 5180）

数据库：PostgreSQL + Drizzle ORM，架构通过迁移文件管理

## 常用命令

### 后端 (from backend-nest/)
```bash
pnpm run start:dev    # 开发模式热重载
pnpm run build        # 生产构建
pnpm run lint         # ESLint 检查
pnpm run test         # 单元测试
pnpm run test:e2e     # e2e 测试
npx ts-node scripts/create-admin.ts  # 创建管理员 (admin/admin123)
```

### 前端 (from frontend/)
```bash
pnpm run dev    # 开发模式
pnpm run build  # 生产构建
```

## 架构要点

### 后端结构
- `modules/` - 功能模块（article, intelligence, auth, import, upload, quiz, feedback, satellite-sync, satellite-metadata, membership, milestone, company, push-record, user）
- `common/` - 共享：entities, guards, filters, interceptors, enums
- `config/` - @nestjs/config 配置
- `database/` - Drizzle ORM 配置
  - `schema/` - 表结构定义（articles.ts, users.ts 等）
  - `migrations/` - SQL 迁移文件
- `modules/*/` - 功能模块，每个包含：*.module.ts, *.controller.ts, *.service.ts, dto/*.dto.ts

### 前端结构
- `views/` - 页面组件
- `components/layout/` - AdminLayout 侧边栏布局
- `stores/` - Pinia stores（auth store）
- `api/` - Axios 客户端（含请求/响应拦截器）
- `router/` - Vue Router（含 auth 守卫）

### 认证流程
JWT token 存于 localStorage (`admin_token`)，前端拦截器自动添加 Bearer token，后端使用 JwtAuthGuard 和 AdminGuard 保护路由。

### API 响应格式
- 成功：`{ success: true, data, message }`
- 分页：`{ data, total, page, limit, totalPages }`
- 全局异常：AllExceptionsFilter

### 核心实体
- **Article** (`education_articles`) - 分类: basic/advanced/mission/people
- **Intelligence** (`intelligences`) - 分类: launch/satellite/industry/research/environment，等级: free/advanced/professional
- **User** (`users`) - 角色: user/admin/super_admin
- **Quiz**, **Feedback**, **PushRecord**, **SatelliteMetadata**, **Membership**, **Milestone**, **Company**

## 重要约定

- 所有 API 路由前缀 `/api`
- 数据库迁移文件在 `backend-nest/src/database/migrations/`，格式 `YYYYMMDD-description.sql`
- 数据库使用 Drizzle ORM，迁移文件在 `database/migrations/`
