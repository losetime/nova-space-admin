# KeepTrack 元数据同步更新说明

## 修改概述

本次更新优化了 KeepTrack 元数据同步策略，防止 API 请求过于频繁导致 IP 被封禁。

## 主要变更

### 1. 批量大小调整

**文件**: `src/modules/satellite-sync/satellite-sync.service.ts`

- **修改前**: 每次同步 1000 颗卫星
- **修改后**: 每次同步 60 颗卫星
- **原因**: 降低单次请求数量，减少被封 IP 的风险

### 2. 随机延迟调整

**文件**: `src/modules/satellite-sync/satellite-sync.service.ts`

- **修改前**: 每次请求后等待 1-20 秒随机延迟
- **修改后**: 每次请求后等待 10-40 秒随机延迟
- **预估速度**: 60 颗卫星 × 平均 25 秒 ≈ 25 分钟完成一批

### 3. 定时任务功能

**文件**: `src/modules/satellite-sync/satellite-sync.service.ts`

新增定时任务，每小时整点自动触发 KeepTrack 元数据同步：

- **执行时间**: 每小时整点（Cron: `0 * * * *`）
- **触发类型**: 仅触发 `keeptrack-meta` 元数据同步
- **智能跳过**: 如果当前有任务正在运行，自动跳过本轮并记录日志
- **开关控制**: 可通过 API 动态开启/关闭定时任务

## API 端点

### 1. 获取定时任务状态

```http
GET /api/satellite-sync/cron/status
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "enabled": true
  }
}
```

### 2. 切换定时任务开关

```http
POST /api/satellite-sync/cron/toggle
Content-Type: application/json

{
  "enabled": false
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "enabled": false,
    "message": "定时任务已禁用"
  }
}
```

## 使用场景

### 场景 1: 启用自动同步（默认）

系统启动后，定时任务默认开启，每小时整点自动检查并同步 KeepTrack 元数据。

### 场景 2: 临时停止自动同步

如果需要临时停止自动同步（例如 API 配额不足、维护期间等），可以调用 API 关闭：

```bash
curl -X POST http://localhost:3002/api/satellite-sync/cron/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### 场景 3: 手动触发同步

即使定时任务关闭，仍可手动触发同步：

```bash
curl -X POST http://localhost:3002/api/satellite-sync \
  -H "Content-Type: application/json" \
  -d '{"type": "keeptrack-meta", "force": false}'
```

## 日志说明

### 定时任务日志

定时任务执行时会输出以下日志：

- **检查阶段**: `[定时任务] 检查是否需要触发 KeepTrack 元数据同步...`
- **跳过执行**: `[定时任务] 跳过本次同步，当前有任务正在运行: {taskId} ({processed}/{total})`
- **开始执行**: `[定时任务] 开始触发 KeepTrack 元数据同步`
- **执行失败**: `[定时任务] 触发同步失败: {errorMessage}`
- **已禁用**: `[定时任务] KeepTrack 元数据同步已禁用，跳过`

### 开关控制日志

- **启用**: `定时任务已启用`
- **禁用**: `定时任务已禁用`

## 注意事项

1. **首次同步**: 如果数据库中有大量卫星缺少元数据，需要多轮定时任务才能完成全部同步
2. **跳过策略**: 如果上一轮同步还未完成，下一轮会自动跳过，避免并发冲突
3. **API 配额**: KeepTrack API Key 用户限额为 2000 次/小时，当前策略（60颗/批 + 10-40秒延迟）在安全范围内
4. **重启影响**: 定时任务开关状态保存在内存中，服务重启后会重置为默认开启状态

## 性能预估

假设有 10,000 颗卫星需要同步元数据：

- **每批数量**: 60 颗
- **每批耗时**: 约 25 分钟
- **所需批次**: 10,000 ÷ 60 ≈ 167 批
- **总耗时**: 167 批 × 1 小时/批 = 约 7 天

实际时间可能更短，因为：
- 部分卫星已有元数据，无需同步
- 并非所有卫星都有 KeepTrack 数据
- 部分请求可能失败（API 限制、网络问题等）

## 相关配置

KeepTrack API Key 配置位置：

```bash
# .env
KEEPTRACK_API_KEY=your_api_key_here
```

如果未配置 API Key，定时任务会跳过同步并记录警告日志。