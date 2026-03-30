# 多数据源卫星同步服务 — 最终设计方案

**日期**: 2026-03-29
**状态**: 设计完成，待实现

---

## 需求概述

1. **TLE 数据源**: CelesTrak 为主，Space-Track 备用
2. **元数据源**: ESA DISCOS 为主，KeepTrack 备用（代码实现，等 Token）
3. **数据标记**: 添加 `source` 字段区分数据来源
4. **CelesTrak 范围**: `GROUP=active`（已排除火箭和碎片）

---

## 数据源最终策略

| 数据源 | 用途 | 优先级 | 状态 |
|--------|------|--------|------|
| **CelesTrak** | TLE | 主 | ✅ 可用（无需认证） |
| **Space-Track** | TLE | 备用 | ✅ 可用（账号已配置） |
| **ESA DISCOS** | 元数据 | 主 | ✅ 可用（Token 已验证） |
| **KeepTrack** | 元数据 | 备用 | ⏳ 代码实现，等 Token |

---

## SyncType 设计

```typescript
export type SyncType =
  | 'celestrak'        // CelesTrak TLE 同步（主数据源）
  | 'space-track'      // Space-Track TLE 同步（备用源）
  | 'keeptrack-tle'    // KeepTrack TLE 同步（备用，需 API Key）
  | 'keeptrack-meta'   // KeepTrack 元数据同步（需 API Key）
  | 'discos'           // ESA DISCOS 元数据同步（主数据源）
  | 'all';             // 完整同步（CelesTrak + Space-Track + ESA DISCOS，KeepTrack 如有 Key）
```

---

## 数据库修改

### satellite_tle 表

```sql
ALTER TABLE satellite_tle
  ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'celestrak',
  ADD INDEX idx_source (source);
```

**实体字段**:
```typescript
@Column({ type: 'varchar', length: 20, default: 'celestrak' })
source: string;
```

### satellite_metadata 表

无需修改，已包含所有所需字段：

**ESA DISCOS 字段**:
- `cosparId`, `objectClass`, `launchMass`, `shape`, `dimensions`, `span`
- `mission`, `firstEpoch`, `operator`, `contractor`, `predDecayDate`
- `hasDiscosData`

**KeepTrack 字段**:
- `purpose`, `bus`, `configuration`, `motor`, `power`
- `launchPad`, `dryMass`, `length`, `diameter`
- `equipment`, `adcs`, `payload`, `constellationName`
- `hasExtendedData`

---

## 服务层设计

### 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                    SatelliteSyncService                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  syncCelestrak()                                                 │
│    └─→ fetchCelestrakData() → 批量保存 TLE                        │
│                                                                  │
│  syncTle() [Space-Track]                                         │
│    └─→ loginSpaceTrack() → fetchGpBatch() → 批量保存 TLE          │
│                                                                  │
│  syncKeepTrackBrief() [需 API Key]                               │
│    └─→ fetchBriefData() → 批量保存 TLE + 基础元数据                │
│                                                                  │
│  syncKeepTrackDetail() [需 API Key]                              │
│    └─→ 逐条获取详情 → 更新扩展元数据                               │
│                                                                  │
│  syncDiscos()                                                    │
│    └─→ 逐条获取 ESA 数据 → 更新元数据                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 条件启用逻辑

```typescript
// KeepTrack 同步前检查
if (!this.keepTrackApiKey) {
  this.logger.warn('KeepTrack API Key 未配置，跳过 KeepTrack 同步');
  return;
}

// ESA DISCOS 同步前检查
if (!this.esaDiscosApiToken) {
  this.logger.warn('ESA DISCOS Token 未配置，跳过元数据同步');
  return;
}
```

---

## 同步优先级（all 类型）

```
1. CelesTrak TLE → 主数据源
2. Space-Track TLE → 补充 CelesTrak 没有的卫星
3. KeepTrack TLE → 补充（如有 API Key）
4. KeepTrack Meta → 扩展元数据（如有 API Key）
5. ESA DISCOS → 主元数据源
```

---

## API 接口

### 启动同步

```
POST /api/satellite-sync
Body: { "type": "celestrak" | "space-track" | "keeptrack-tle" | "keeptrack-meta" | "discos" | "all" }
```

### 查询状态

```
GET /api/satellite-sync/status
```

### 查询统计

```
GET /api/satellite-sync/stats

Response: {
  tleCount: number,
  metadataCount: number,
  discosCount: number,
  discosCoverage: string,
  celestrakCount?: number,
  keepTrackCount?: number,
  lastTleSync?: string,
  lastDiscosSync?: string,
  lastCelestrakSync?: string,
  lastKeepTrackSync?: string
}
```

---

## 前端展示

### 统计卡片

```
┌─────────────────────────────────────────────────────────┐
│  TLE 数据统计                                            │
├─────────────────────────────────────────────────────────┤
│  总数：14,879 条                                        │
│  - CelesTrak: 14,000 (94%)                              │
│  - Space-Track: 879 (6%)                                │
│  - KeepTrack: 0 (需 API Key)                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  元数据统计                                              │
├─────────────────────────────────────────────────────────┤
│  基础元数据：14,879 条 (100%)                           │
│  ESA DISCOS: 5,000 条 (34%)                             │
│  KeepTrack: 0 条 (需 API Key)                           │
└─────────────────────────────────────────────────────────┘
```

### 同步按钮

```
[TLE 同步 (CelesTrak)] [TLE 同步 (Space-Track)]
[元数据同步 (ESA)] [元数据同步 (KeepTrack)] [完整同步]
```

KeepTrack 按钮在 API Key 未配置时显示提示。

---

## 环境变量配置

```env
# CelesTrak - 无需配置

# Space-Track
SPACE_TRACK_USERNAME=your_username
SPACE_TRACK_PASSWORD=your_password

# ESA DISCOS
ESA_DISCOS_API_TOKEN=your_token

# KeepTrack（可选）
KEEPTRACK_API_KEY=your_api_key
```

---

## 实施步骤

1. **配置层**: 添加 CelesTrak 和 KeepTrack 配置
2. **实体层**: 添加 `source` 字段，扩展 `SyncType`
3. **服务层**: 实现 CelesTrak 和 KeepTrack 同步逻辑
4. **数据库**: 运行迁移
5. **测试**: 验证 CelesTrak、Space-Track、ESA DISCOS
6. **前端**: 添加多数据源 UI（可选）

---

## 验收标准

- [ ] CelesTrak 同步可正常拉取 TLE 数据
- [ ] `satellite_tle` 表 `source` 字段正确标记
- [ ] ESA DISCOS 元数据同步正常
- [ ] KeepTrack 代码编译通过，无 API Key 时跳过
- [ ] 统计 API 正确返回各数据源数量
- [ ] `all` 类型正确执行多数据源同步

---

## 更新历史

| 日期 | 内容 |
|------|------|
| 2026-03-29 | 最终方案：CelesTrak 主 TLE，ESA 主元数据，KeepTrack 代码实现等 Token |
