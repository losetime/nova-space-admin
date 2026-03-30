# TLE 同步策略调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 TLE 同步的主备顺序从 "CelesTrak → Space-Track → KeepTrack" 调整为 "KeepTrack → Space-Track → CelesTrak"，使 TLE 策略与元数据同步策略对齐（KeepTrack 为主数据源）。

**Architecture:**
- 修改 `executeSync()` 方法中的 TLE 降级链顺序
- 更新前端按钮标签，将 "同步 CelesTrak（主）" 改为 "同步 KeepTrack TLE（主）"
- 更新所有相关注释和日志信息

**Tech Stack:** NestJS, TypeORM, Vue 3, TypeScript

---

### Task 1: 修改 backend executeSync() 中的 TLE fallback 链

**Files:**
- Modify: `backend-nest/src/modules/satellite-sync/satellite-sync.service.ts:346-415`

- [ ] **Step 1: 修改 TLE 同步顺序为 KeepTrack → Space-Track → CelesTrak**

将 `executeSync()` 方法中 'all' 分支的 TLE 同步逻辑从：

```typescript
// TLE 数据同步：CelesTrak（主） → Space-Track（备用） → KeepTrack（备用）
let tleSyncSuccess = false;

this.logger.log('[完整同步] 开始 TLE 数据同步 - 主数据源 CelesTrak');
try {
  await this.syncCelestrak(task);
  tleSyncSuccess = true;
  this.logger.log('[完整同步] CelesTrak TLE 同步成功，跳过备用源');
} catch (error) {
  this.logger.warn(`[完整同步] CelesTrak 失败：${error.message}，尝试 Space-Track 备用源`);
}

if (!tleSyncSuccess) {
  try {
    await this.syncTle(task);
    tleSyncSuccess = true;
    this.logger.log('[完整同步] Space-Track TLE 同步成功，跳过 KeepTrack');
  } catch (error) {
    this.logger.warn(`[完整同步] Space-Track 失败：${error.message}，尝试 KeepTrack 备用源`);
  }
}

if (!tleSyncSuccess && this.keepTrackApiKey) {
  try {
    await this.syncKeepTrackBrief(task);
    tleSyncSuccess = true;
    this.logger.log('[完整同步] KeepTrack TLE 同步成功');
  } catch (error) {
    this.logger.warn(`[完整同步] KeepTrack TLE 失败：${error.message}`);
  }
}

if (!tleSyncSuccess) {
  this.logger.error('[完整同步] 所有 TLE 数据源均失败');
}
```

改为：

```typescript
// TLE 数据同步：KeepTrack（主） → Space-Track（备用） → CelesTrak（兜底）
let tleSyncSuccess = false;

// 优先使用 KeepTrack（主数据源，与元数据策略对齐）
if (this.keepTrackApiKey) {
  this.logger.log('[完整同步] 开始 TLE 数据同步 - 主数据源 KeepTrack');
  try {
    await this.syncKeepTrackBrief(task);
    tleSyncSuccess = true;
    this.logger.log('[完整同步] KeepTrack TLE 同步成功，跳过备用源');
  } catch (error) {
    this.logger.warn(`[完整同步] KeepTrack TLE 失败：${error.message}，尝试 Space-Track 备用源`);
  }
} else {
  this.logger.warn('[完整同步] KeepTrack API Key 未配置，尝试 Space-Track 备用源');
}

if (!tleSyncSuccess) {
  try {
    await this.syncTle(task);
    tleSyncSuccess = true;
    this.logger.log('[完整同步] Space-Track TLE 同步成功，跳过 CelesTrak');
  } catch (error) {
    this.logger.warn(`[完整同步] Space-Track 失败：${error.message}，尝试 CelesTrak 兜底源`);
  }
}

if (!tleSyncSuccess) {
  try {
    await this.syncCelestrak(task);
    tleSyncSuccess = true;
    this.logger.log('[完整同步] CelesTrak TLE 同步成功（兜底）');
  } catch (error) {
    this.logger.warn(`[完整同步] CelesTrak 失败：${error.message}`);
  }
}

if (!tleSyncSuccess) {
  this.logger.error('[完整同步] 所有 TLE 数据源均失败');
}
```

- [ ] **Step 2: 更新独立 syncCelestrak 方法的注释**

将 `syncCelestrak()` 方法顶部的注释从：
```typescript
/**
 * CelesTrak TLE 数据同步
 */
```

改为：
```typescript
/**
 * CelesTrak TLE 数据同步（兜底数据源）
 */
```

- [ ] **Step 3: 更新 syncCelestrak() 内部日志**

将日志从：
```typescript
this.logger.log('开始 CelesTrak TLE 数据同步...');
```

改为：
```typescript
this.logger.log('开始 CelesTrak TLE 数据同步（兜底源）...');
```

- [ ] **Step 4: 提交**

```bash
git add backend-nest/src/modules/satellite-sync/satellite-sync.service.ts
git commit -m "refactor: TLE 同步策略调整为 KeepTrack 主数据源，CelesTrak 兜底
- 修改 executeSync() 中 TLE fallback 链顺序：KeepTrack → Space-Track → CelesTrak
- 与元数据同步策略保持一致（KeepTrack 优先）
- 更新相关日志和注释"
```

---

### Task 2: 更新前端按钮标签

**Files:**
- Modify: `frontend/src/views/SatelliteSyncView.vue:26-57`

- [ ] **Step 1: 更新 TLE 区域按钮标签**

将 TLE 区域的三个按钮从：

```vue
<t-button
  theme="primary"
  size="large"
  :loading="syncing === 'celestrak'"
  :disabled="!!syncing"
  @click="handleSync('celestrak')"
>
  <template #icon><CloudDownloadIcon /></template>
  同步 CelesTrak（主）
</t-button>
<t-button
  theme="default"
  size="large"
  variant="outline"
  :loading="syncing === 'space-track'"
  :disabled="!!syncing"
  @click="handleSync('space-track')"
>
  <template #icon><CloudDownloadIcon /></template>
  同步 Space-Track（备用）
</t-button>
<t-button
  theme="default"
  size="large"
  variant="outline"
  :loading="syncing === 'keeptrack-tle'"
  :disabled="!!syncing"
  @click="handleSync('keeptrack-tle')"
>
  <template #icon><CloudDownloadIcon /></template>
  同步 KeepTrack TLE
</t-button>
```

改为：

```vue
<t-button
  theme="primary"
  size="large"
  :loading="syncing === 'keeptrack-tle'"
  :disabled="!!syncing"
  @click="handleSync('keeptrack-tle')"
>
  <template #icon><CloudDownloadIcon /></template>
  同步 KeepTrack TLE（主）
</t-button>
<t-button
  theme="default"
  size="large"
  variant="outline"
  :loading="syncing === 'space-track'"
  :disabled="!!syncing"
  @click="handleSync('space-track')"
>
  <template #icon><CloudDownloadIcon /></template>
  同步 Space-Track（备用）
</t-button>
<t-button
  theme="default"
  size="large"
  variant="outline"
  :loading="syncing === 'celestrak'"
  :disabled="!!syncing"
  @click="handleSync('celestrak')"
>
  <template #icon><CloudDownloadIcon /></template>
  同步 CelesTrak（兜底）
</t-button>
```

注意：按钮顺序也需要调整，KeepTrack 按钮移到最前面作为主按钮。

- [ ] **Step 2: 更新 TLE 区域的数据源说明**

将 "数据源说明" 卡片中 TLE 部分的列表从：
```vue
<li><strong>CelesTrak</strong> - 主数据源，获取活跃卫星 GROUP=active，约 14,879 颗，免费无需认证</li>
<li><strong>Space-Track</strong> - 备用数据源，需要账号认证</li>
<li><strong>KeepTrack</strong> - 备用数据源，需要 API Key</li>
```

改为：
```vue
<li><strong>KeepTrack</strong> - 主数据源，提供 TLE 和扩展元数据，需要 API Key</li>
<li><strong>Space-Track</strong> - 备用数据源，需要账号认证</li>
<li><strong>CelesTrak</strong> - 兜底数据源，获取活跃卫星 GROUP=active，免费无需认证</li>
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/views/SatelliteSyncView.vue
git commit -m "ui: 更新 TLE 同步按钮标签，KeepTrack 标记为主数据源
- 按钮顺序调整为：KeepTrack（主）→ Space-Track（备用）→ CelesTrak（兜底）
- 更新数据源说明文本
- 与后端同步策略保持一致"
```

---

### Task 3: 验证和测试

**Files:**
- Test: 手动触发同步验证

- [ ] **Step 1: 启动后端开发服务器**

```bash
cd backend-nest
pnpm run start:dev
```

- [ ] **Step 2: 启动前端开发服务器**

```bash
cd frontend
pnpm run dev
```

- [ ] **Step 3: 验证前端显示**

访问 http://localhost:5180，进入卫星同步页面，确认：
- TLE 区域主按钮显示 "同步 KeepTrack TLE（主）"
- 备用按钮显示 "同步 Space-Track（备用）"
- 兜底按钮显示 "同步 CelesTrak（兜底）"

- [ ] **Step 4: 查看后端日志**

在后端控制台查看日志输出，确认注释和日志信息已更新

- [ ] **Step 5: 提交最终验证**

```bash
git status
```

确认所有改动已提交

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ executeSync() TLE fallback 链顺序调整
- ✅ syncCelestrak() 注释和日志更新
- ✅ 前端按钮标签和顺序更新
- ✅ 数据源说明文本更新

**2. Placeholder scan:**
- ✅ 无 TBD/TODO 占位符
- ✅ 所有代码步骤都有具体内容
- ✅ 所有文件路径精确

**3. Type consistency:**
- ✅ SyncType 类型保持不变（'celestrak' | 'space-track' | 'keeptrack-tle' 等）
- ✅ 方法签名无变化
- ✅ 日志格式一致
