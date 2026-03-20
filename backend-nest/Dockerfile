# 后端 Dockerfile - 多阶段构建

# 阶段1: 构建应用
FROM node:22-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 阶段2: 生产环境
FROM node:22-alpine AS production

WORKDIR /app

# 设置 Node 环境
ENV NODE_ENV=production

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制编译后的文件
COPY --from=builder /app/dist ./dist

# 创建数据目录
RUN mkdir -p /app/cache /app/data

# 暴露端口
EXPOSE 3002

# 启动应用
CMD ["node", "dist/main.js"]