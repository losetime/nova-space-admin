# 卫星数据同步方案

> 本文档描述如何完整获取卫星 TLE 数据和 ESA DISCOS 扩展元数据，用于管理端手动触发同步。

---

## 概述

### 当前问题

| 数据类型 | 当前状态 | 问题 |
|----------|----------|------|
| TLE 数据 | 100 条 | 测试数据，太少 |
| ESA DISCOS 元数据 | 10 条（10%） | 懒加载，数据不全 |
| 用途筛选 | 6 种分类 | 数据不足导致分类少 |
| 运营商筛选 | 7 种 | 数据不足导致选项少 |

### 目标

| 数据类型 | 目标数量 | 来源 |
|----------|----------|------|
| TLE 数据 | ~10,000 条 | Space-Track API |
| ESA DISCOS 元数据 | ~10,000 条 | ESA DISCOS API |
| 用途分类 | 完整覆盖 | ESA DISCOS mission |
| 运营商数据 | 完整覆盖 | ESA DISCOS operators |

---

## 数据流程

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Space-Track    │     │   PostgreSQL    │     │   ESA DISCOS    │
│  API            │     │   Database      │     │   API           │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. 分批获取 TLE        │                       │
         │    + 基础元数据        │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │                       │  2. 批量获取扩展元数据  │
         │                       │      (mission/operator)│
         │                       │◄──────────────────────┤
         │                       │                       │
         │                       │  3. 更新数据库         │
         │                       │                       │
```

---

## 阶段一：TLE 数据分批获取

### Space-Track API 限制

| 限制类型 | 值 | 说明 |
|---------|---|------|
| 短期限制 | < 30 请求/分钟 | 超出返回错误 |
| 长期限制 | < 300 请求/小时 | 账户可能被暂停 |
| GP 数据 | 1 次/小时 | 官方建议频率 |

### 分批策略

按 NORAD ID 范围分批，避免单次请求数据量过大：

| 批次 | NORAD ID 范围 | 说明 |
|-----|--------------|------|
| 1 | 1 - 9,999 | 早期卫星 |
| 2 | 10,000 - 19,999 | 1980s-1990s |
| 3 | 20,000 - 29,999 | 1990s-2000s |
| 4 | 30,000 - 39,999 | 2000s-2010s |
| 5 | 40,000 - 49,999 | 2010s-2020s |
| 6 | 50,000+ | 2020s 至今 |

### API 请求格式

```
GET /basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/decay_date/null-val/epoch/%3Enow-10/NORAD_CAT_ID/1--9999/format/json
```

### 安全参数

| 参数 | 值 | 说明 |
|-----|---|------|
| 批次间隔 | 3 秒 | 每批请求后等待 |
| 限流等待 | 60 秒 | 触发 429 后等待 |
| 最大重试 | 3 次 | 单批最大重试次数 |
| 预计总时长 | ~30 秒 | 6 批 × 3 秒 + 网络时间 |

---

## 阶段二：ESA DISCOS 批量同步

### ESA DISCOS API 限流机制

**官方机制**：API 动态返回限流状态，无需猜测限制值。

| 响应头 | 说明 |
|--------|------|
| `X-RateLimit-Limit` | 窗口内允许的总请求数 |
| `X-RateLimit-Remaining` | 剩余请求数 |
| `X-RateLimit-Reset` | 窗口重置时间（Unix 时间戳） |
| `Retry-After` | 429 时返回，等待秒数 |

### 智能同步策略

```typescript
async syncWithRateLimit(noradId: string) {
  const response = await fetch(url, { headers });

  // 读取限流状态
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const resetTime = response.headers.get('X-RateLimit-Reset');

  if (response.status === 429) {
    // 触发限流，等待 Retry-After 秒
    const retryAfter = response.headers.get('Retry-After') || '60';
    await this.sleep(parseInt(retryAfter) * 1000);
  } else if (parseInt(remaining) < 10) {
    // 剩余较少，等待到重置时间
    const waitTime = resetTime - Date.now() / 1000;
    await this.sleep(waitTime * 1000);
  }

  return response.json();
}
```

### 预计耗时

- 数据量：~10,000 颗卫星
- 智能限流：根据 API 实际返回动态调整
- 预计时间：**1-2 小时**（后台执行）

---

## 管理端接口设计

### 同步 API

```
POST /api/admin/satellites/sync
```

**请求体**：
```json
{
  "type": "tle" | "discos" | "all",
  "force": false
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "taskId": "sync-20260326-001",
    "status": "running",
    "progress": {
      "total": 10000,
      "processed": 1500,
      "success": 1480,
      "failed": 20
    }
  }
}
```

### 同步状态查询

```
GET /api/admin/satellites/sync/status
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "taskId": "sync-20260326-001",
    "type": "discos",
    "status": "running",
    "startedAt": "2026-03-26T10:00:00Z",
    "progress": {
      "total": 10000,
      "processed": 3500,
      "success": 3400,
      "failed": 100
    },
    "estimatedTimeRemaining": "45 minutes"
  }
}
```

---

## 实现清单

### 后端修改

| 文件 | 修改内容 |
|-----|---------|
| `space-track.service.ts` | 添加 `fetchGpDataBatch()` 分批获取方法 |
| `discos-sync.service.ts` | 新增批量同步服务，智能限流处理 |
| `admin.controller.ts` | 添加同步 API 端点 |
| `satellite.module.ts` | 注册新服务 |

### 前端修改（管理端）

| 文件 | 修改内容 |
|-----|---------|
| `AdminSync.vue` | 同步管理页面 |
| `api/admin.ts` | 管理端 API 调用 |

---

## 执行步骤

### 1. 清空现有测试数据

```sql
TRUNCATE TABLE satellite_tle;
TRUNCATE TABLE satellite_metadata;
```

### 2. 执行 TLE 同步

```bash
curl -X POST http://localhost:3001/api/admin/satellites/sync \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "tle"}'
```

### 3. 执行 ESA DISCOS 同步

```bash
curl -X POST http://localhost:3001/api/admin/satellites/sync \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "discos"}'
```

### 4. 验证数据完整性

```bash
# 检查数据量
curl http://localhost:3001/api/satellites/stats

# 检查用途分类
curl http://localhost:3001/api/satellites/purposes

# 检查运营商列表
curl http://localhost:3001/api/satellites/operators
```

---

## 错误处理

### Space-Track 错误

| 状态码 | 处理方式 |
|--------|----------|
| 401 | 重新登录获取 session |
| 429 | 等待 60 秒后重试 |
| 500+ | 等待 30 秒后重试，最多 3 次 |

### ESA DISCOS 错误

| 状态码 | 处理方式 |
|--------|----------|
| 401 | 检查 API Token 配置 |
| 429 | 读取 `Retry-After` header 等待 |
| 404 | 卫星不在 DISCOS 数据库，跳过 |

---

## 定时任务（可选）

```typescript
// 每日凌晨 3 点刷新 TLE
@Cron('0 3 * * *')
async dailyTleSync() {
  await this.syncTle();
}

// 每周日凌晨 4 点增量同步 DISCOS
@Cron('0 4 * * 0')
async weeklyDiscosSync() {
  await this.syncDiscosIncremental();
}
```

---

## 参考资料

- [Space-Track API 文档](https://www.space-track.org/documentation#/api)
- [ESA DISCOS OpenAPI 规范](./openapi-v2.yml)
- [卫星数据源方案](./satellite-data-solution.md)

---

## 更新历史

| 日期 | 内容 |
|-----|------|
| 2026-03-26 | 初始版本，完整同步方案 |