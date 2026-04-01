# Nova Space Admin

太空教育文章和情报内容管理后台系统。

## 项目概述

Nova Space Admin 是一个 Monorepo 项目，包含用于管理太空教育文章和情报内容的后台管理系统。项目由以下部分组成：

- **backend-nest**: NestJS 后端 API 服务（端口 3002）
- **frontend**: Vue 3 管理后台前端界面（端口 5180）

本管理系统使用 PostgreSQL 数据库，**数据库架构完全由本项目控制和管理**，通过数据库迁移文件维护所有表结构。

## 技术栈

### 后端
- NestJS 11
- TypeORM + PostgreSQL
- JWT 认证 + Passport
- TypeScript

### 前端
- Vue 3 + Composition API
- Pinia 状态管理
- Vue Router
- TDesign UI 组件库
- TipTap 富文本编辑器
- Vite 构建工具
- TypeScript

## 快速开始

### 环境要求

- Node.js 18+
- pnpm
- PostgreSQL 14+
- Docker Desktop（用于 MinIO 对象存储）

### 后端启动

```bash
cd backend-nest

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等参数

# 开发模式启动
pnpm run start:dev

# 生产构建
pnpm run build

# 运行测试
pnpm run test
pnpm run test:e2e

# 代码检查
pnpm run lint

# 创建管理员账户
npx ts-node scripts/create-admin.ts
# 默认账户: admin / admin123
```

### 前端启动

```bash
cd frontend

# 安装依赖
pnpm install

# 开发模式启动
pnpm run dev

# 生产构建
pnpm run build
```

### MinIO 对象存储启动

图片上传功能需要 MinIO 对象存储服务。

**首次启动前**，先创建 Docker 网络：

```bash
docker network create nova-network
```

然后启动 MinIO：

```bash
docker-compose up -d minio
```

访问地址：
- API: http://localhost:9000
- 控制台: http://localhost:9001
- 用户名: admin
- 密码: admin123456

> 注意：MinIO 为可选服务，未启动时其他功能仍可正常使用。

### Docker 部署

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 停止服务
docker-compose down
```

## 项目结构

### 后端结构

```
backend-nest/src/
├── modules/           # 功能模块
│   ├── article/       # 文章管理
│   ├── intelligence/  # 情报管理
│   ├── auth/          # 认证授权
│   ├── user/          # 用户管理
│   ├── import/        # 数据导入
│   ├── upload/        # 文件上传
│   ├── quiz/          # 测验管理
│   ├── feedback/      # 反馈管理
│   ├── push-record/   # 推送记录
│   └── satellite-sync/# 卫星数据同步
├── common/            # 共享模块
│   ├── entities/      # 实体类
│   ├── guards/        # 守卫
│   ├── filters/       # 过滤器
│   ├── interceptors/  # 拦截器
│   └── enums/         # 枚举定义
├── config/            # 配置模块
├── database/          # 数据库相关
│   └── migrations/    # 数据库迁移文件
└── main.ts            # 应用入口
```

每个模块遵循 NestJS 标准结构：
- `*.module.ts` - 模块定义
- `*.controller.ts` - REST API 控制器
- `*.service.ts` - 业务逻辑服务
- `entities/*.entity.ts` - TypeORM 实体类
- `dto/*.dto.ts` - 数据传输对象（带 class-validator 验证）

### 前端结构

```
frontend/src/
├── views/             # 页面组件
│   ├── ArticlesView   # 文章管理页面
│   ├── IntelligenceView # 情报管理页面
│   ├── DashboardView  # 仪表盘页面
│   ├── LoginView      # 登录页面
│   └── ...
├── components/        # 通用组件
│   └── layout/        # 布局组件（侧边栏等）
├── stores/            # Pinia 状态管理
│   └── auth.ts        # 认证状态
├── api/               # Axios API 客户端
├── router/            # Vue Router 路由配置
├── assets/            # 静态资源
└── App.vue            # 应用根组件
```

## 数据模型

### 核心实体

- **Article** (`education_articles`): 教育文章
  - 分类: basic（基础）、advanced（进阶）、mission（任务）、people（人物）
  
- **Intelligence** (`intelligences`): 太空情报
  - 分类: launch（发射）、satellite（卫星）、industry（行业）、research（研究）、environment（环境）
  - 等级: free（免费）、advanced（高级）、professional（专业）

- **User** (`users`): 用户
  - 角色: user（普通用户）、admin（管理员）、super_admin（超级管理员）

- **Quiz** (`quizzes`): 测验题目
- **Feedback** (`feedbacks`): 用户反馈
- **PushRecord** (`push_records`): 推送记录

### 数据库架构管理

本项目通过数据库迁移文件管理所有表结构：
- 迁移文件位于 `backend-nest/src/database/migrations/`
- 所有表结构变更通过迁移文件进行版本控制
- 支持增量迁移和回滚

## 认证机制

- 基于 JWT 的认证系统
- 使用 Passport 中间件
- Token 存储在前端 localStorage（`admin_token`）
- 前端 API 拦截器自动添加 Bearer Token
- 后端使用 JwtAuthGuard 和 AdminGuard 保护路由

## API 规范

### 请求格式

- 所有 API 路径前缀：`/api`
- 响应统一格式：`{ success, data, message }`（通过 TransformInterceptor）
- 全局异常处理：AllExceptionsFilter

### 分页查询

- 分页参数：`page`（页码）、`limit`（每页数量）
- 返回格式：`{ data, total, page, limit, totalPages }`

## 功能特性

### 文章管理
- 创建、编辑、删除教育文章
- 富文本编辑器支持
- 分类管理
- 批量导入（CSV/Excel）

### 情报管理
- 太空情报内容管理
- 多等级内容控制
- 分类筛选
- 批量导入

### 用户管理
- 用户列表查看
- 权限管理
- 管理员账户创建

### 数据导入
- 支持 CSV 和 Excel 文件上传
- 批量导入文章和情报数据
- 文件解析和验证
- 批量插入数据库

### 卫星数据同步
- TLE 数据自动同步
- Space-Track API 集成
- CelesTrak 数据源
- KeepTrack 可视化集成

### 其他功能
- 测验题目管理
- 用户反馈收集
- 推送记录跟踪
- 健康检查接口

## 开发指南

### API 开发

1. 在对应模块的 `entities/` 创建实体类
2. 在 `dto/` 创建 DTO 和验证规则
3. 在 `*.service.ts` 实现业务逻辑
4. 在 `*.controller.ts` 定义 API 路由
5. 在 `*.module.ts` 注册模块

### 前端开发

1. 在 `views/` 创建页面组件
2. 在 `api/` 定义 API 调用方法
3. 在 `stores/` 管理状态（如需要）
4. 在 `router/` 配置路由
5. 使用 TDesign 组件构建 UI

### 数据库迁移

1. 在 `backend-nest/src/database/migrations/` 创建迁移 SQL 文件
2. 文件命名格式：`YYYYMMDD-description.sql`
3. 编写迁移 SQL 语句
4. 通过脚本或手动执行迁移

## 配置说明

### 后端环境变量

```env
DB_HOST=postgres          # 数据库主机
DB_PORT=5432              # 数据库端口
DB_USERNAME=postgres      # 数据库用户名
DB_PASSWORD=your_password # 数据库密码
DB_NAME=nova_space        # 数据库名称
JWT_SECRET=your_secret    # JWT 密钥
JWT_EXPIRES_IN=7d         # JWT 过期时间
PORT=3002                 # 服务端口
FRONTEND_URL=http://localhost:5180 # 前端地址

# MinIO 对象存储
MINIO_ENDPOINT=localhost   # Docker 部署改为 minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin123456
MINIO_BUCKET=nova-space
MINIO_USE_SSL=false
```

### 前端配置

前端通过 Vite 配置文件管理构建参数，API 基础地址通过 `src/api/` 模块配置。

## 许可证

UNLICENSED - 私有项目