# 多数据源卫星同步服务实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将卫星数据同步服务改造为多数据源架构，CelesTrak 作为 TLE 主数据源，ESA DISCOS 作为元数据主数据源，KeepTrack 代码实现（等 Token 测试）

**Architecture:**
- TLE 同步：CelesTrak (主) → Space-Track (备用) → KeepTrack (代码实现，等 API Key)
- 元数据同步：ESA DISCOS (主) → KeepTrack (代码实现，等 API Key)
- 数据库添加 `source` 字段标记数据来源
- KeepTrack 服务条件启用：无 API Key 时记录警告日志并跳过

**Tech Stack:** NestJS, TypeORM, PostgreSQL, CelesTrak API, ESA DISCOS API, KeepTrack API

---

## 文件结构

### 修改的文件
- `backend-nest/src/config/app.config.ts` — 添加 CelesTrak 和 KeepTrack 配置
- `backend-nest/src/modules/satellite-sync/dto/sync.dto.ts` — 扩展 SyncType
- `backend-nest/src/modules/satellite-sync/entities/sync-task.entity.ts` — 扩展 SyncType
- `backend-nest/src/modules/satellite-sync/entities/satellite-tle.entity.ts` — 添加 source 字段
- `backend-nest/src/modules/satellite-sync/satellite-sync.service.ts` — 实现多数据源同步逻辑

### 保持不变的文件
- `backend-nest/src/modules/satellite-sync/satellite-sync.controller.ts` — API 接口不变
- `backend-nest/src/modules/satellite-sync/entities/satellite-metadata.entity.ts` — 已包含所有字段

---

### Task 1: 添加配置和 SyncType 扩展

**Files:**
- Modify: `backend-nest/src/config/app.config.ts`
- Modify: `backend-nest/src/modules/satellite-sync/dto/sync.dto.ts`
- Modify: `backend-nest/src/modules/satellite-sync/entities/sync-task.entity.ts`

- [ ] **Step 1: 修改 app.config.ts 添加配置**

```typescript
export default registerAs('app', () => ({
  // ... 现有配置
  celestrak: {
    baseUrl: 'https://celestrak.org/NORAD/elements',
  },
  keepTrack: {
    apiKey: process.env.KEEPTRACK_API_KEY || '',
    baseUrl: 'https://api.keeptrack.space/v4',
  },
}));
```

- [ ] **Step 2: 修改 sync.dto.ts 扩展 SyncType**

```typescript
export type SyncType =
  | 'celestrak'        // CelesTrak TLE 同步
  | 'space-track'      // Space-Track TLE 同步
  | 'keeptrack-tle'    // KeepTrack TLE 同步（需 API Key）
  | 'keeptrack-meta'   // KeepTrack 元数据同步（需 API Key）
  | 'discos'           // ESA DISCOS 元数据同步
  | 'all';             // 完整同步

@IsEnum(['celestrak', 'space-track', 'keeptrack-tle', 'keeptrack-meta', 'discos', 'all'])
type: SyncType;
```

- [ ] **Step 3: 修改 SyncStatsResponse**

```typescript
export interface SyncStatsResponse {
  tleCount: number;
  metadataCount: number;
  discosCount: number;
  discosCoverage: string;
  celestrakCount?: number;
  keepTrackCount?: number;
  lastTleSync?: string;
  lastDiscosSync?: string;
  lastCelestrakSync?: string;
  lastKeepTrackSync?: string;
}
```

- [ ] **Step 4: 修改 sync-task.entity.ts**

```typescript
export type SyncType =
  | 'celestrak'
  | 'space-track'
  | 'keeptrack-tle'
  | 'keeptrack-meta'
  | 'discos'
  | 'all';
```

- [ ] **Step 5: 提交**

```bash
git add backend-nest/src/config/app.config.ts
git add backend-nest/src/modules/satellite-sync/dto/sync.dto.ts
git add backend-nest/src/modules/satellite-sync/entities/sync-task.entity.ts
git commit -m "feat: add CelesTrak/KeepTrack configuration and extend SyncType"
```

---

### Task 2: 添加 TLE 表的 source 字段

**Files:**
- Modify: `backend-nest/src/modules/satellite-sync/entities/satellite-tle.entity.ts`
- Create: `backend-nest/src/database/migrations/add-source-to-tle.sql`

- [ ] **Step 1: 修改 satellite-tle.entity.ts**

```typescript
@Entity('satellite_tle')
@Index(['updatedAt'])
@Index(['source'])
export class SatelliteTle {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  noradId: string;

  @Column({ type: 'varchar', length: 20, default: 'celestrak' })
  source: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  line1: string;

  @Column({ type: 'text' })
  line2: string;

  // ... 其他字段保持不变
}
```

- [ ] **Step 2: 创建迁移 SQL**

```sql
ALTER TABLE satellite_tle
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'celestrak';

CREATE INDEX IF NOT EXISTS idx_satellite_tle_source ON satellite_tle(source);

UPDATE satellite_tle SET source = 'space-track' WHERE source = 'celestrak';
```

- [ ] **Step 3: 提交**

```bash
git add backend-nest/src/modules/satellite-sync/entities/satellite-tle.entity.ts
git add backend-nest/src/database/migrations/add-source-to-tle.sql
git commit -m "feat: add source field to satellite_tle table"
```

---

### Task 3: 实现 CelesTrak TLE 同步服务

**Files:**
- Modify: `backend-nest/src/modules/satellite-sync/satellite-sync.service.ts`

- [ ] **Step 1: 添加 CelesTrak 接口定义**

```typescript
interface CelestrakGpResponse {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  NORAD_CAT_ID: number;
}

private readonly celestrakBaseUrl = 'https://celestrak.org/NORAD/elements';
```

- [ ] **Step 2: 实现 fetchCelestrakData 方法**

```typescript
private async fetchCelestrakData(): Promise<CelestrakGpResponse[]> {
  const url = `${this.celestrakBaseUrl}/gp.php?GROUP=active&FORMAT=json`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Nova-Space-Admin/1.0' },
  });

  if (!response.ok) {
    throw new Error(`CelesTrak API 错误：${response.status}`);
  }

  const data: CelestrakGpResponse[] = await response.json();
  this.logger.log(`获取 ${data.length} 条 CelesTrak 数据`);
  return data;
}
```

- [ ] **Step 3: 实现 syncCelestrak 方法**

```typescript
private async syncCelestrak(task: SatelliteSyncTaskEntity): Promise<void> {
  this.logger.log('开始 CelesTrak TLE 数据同步...');

  const data = await this.fetchCelestrakData();
  task.total = data.length;
  await this.taskRepository.save(task);

  // CelesTrak JSON 不包含 TLE Line1/Line2，只保存轨道参数
  let success = 0;
  for (const item of data) {
    try {
      const noradId = this.formatNoradId(item.NORAD_CAT_ID);

      await this.tleRepository.upsert({
        noradId,
        name: item.OBJECT_NAME,
        source: 'celestrak',
        epoch: new Date(item.EPOCH),
        inclination: item.INCLINATION,
        raan: item.RA_OF_ASC_NODE,
        eccentricity: item.ECCENTRICITY,
        argOfPerigee: item.ARG_OF_PERICENTER,
        meanMotion: item.MEAN_MOTION,
      }, ['noradId']);

      success++;
    } catch (error) {
      this.logger.warn(`保存失败 (${item.OBJECT_NAME}): ${error.message}`);
    }
  }

  task.success = success;
  task.processed = data.length;
  await this.taskRepository.save(task);
}
```

- [ ] **Step 4: 提交**

```bash
git add backend-nest/src/modules/satellite-sync/satellite-sync.service.ts
git commit -m "feat: implement Celestrak TLE sync service"
```

---

### Task 4: 实现 KeepTrack TLE 同步服务

**Files:**
- Modify: `backend-nest/src/modules/satellite-sync/satellite-sync.service.ts`

- [ ] **Step 1: 添加 KeepTrack 配置和接口**

```typescript
private readonly keepTrackApiKey: string;
private readonly keepTrackBaseUrl = 'https://api.keeptrack.space/v4';

interface KeepTrackBriefResponse {
  tle1: string;
  tle2: string;
  type: number;
  name: string;
  altName?: string;
  purpose?: string;
  vmag?: number;
  launchDate?: string;
  country?: string;
  rcs?: string;
  status?: string;
}

// constructor 中初始化
this.keepTrackApiKey = this.configService.get<string>('app.keepTrack.apiKey') || '';
```

- [ ] **Step 2: 实现 syncKeepTrackBrief 方法**

```typescript
private async syncKeepTrackBrief(task: SatelliteSyncTaskEntity): Promise<void> {
  this.logger.log('开始 KeepTrack TLE 数据同步...');

  if (!this.keepTrackApiKey) {
    this.logger.warn('KeepTrack API Key 未配置，跳过 KeepTrack 同步');
    return;
  }

  const url = `${this.keepTrackBaseUrl}/sats/brief`;
  const response = await fetch(url, {
    headers: { 'X-API-Key': this.keepTrackApiKey },
  });

  if (!response.ok) {
    throw new Error(`KeepTrack API 错误：${response.status}`);
  }

  const data: KeepTrackBriefResponse[] = await response.json();
  task.total = data.length;
  await this.taskRepository.save(task);

  let success = 0;
  for (const sat of data) {
    try {
      const noradId = this.extractNoradId(sat.tle1);

      await this.tleRepository.upsert({
        noradId,
        name: sat.name,
        source: 'keeptrack',
        line1: sat.tle1,
        line2: sat.tle2,
      }, ['noradId']);

      success++;
    } catch (error) {
      this.logger.warn(`保存失败 (${sat.name}): ${error.message}`);
    }
  }

  task.success = success;
  task.processed = data.length;
  await this.taskRepository.save(task);
}
```

- [ ] **Step 3: 添加 extractNoradId 辅助方法**

```typescript
private extractNoradId(tle1: string): string {
  const match = tle1.match(/^1\s+(\d+)/);
  if (match) {
    return match[1].padStart(5, '0');
  }
  throw new Error(`无法从 TLE 提取 NORAD ID: ${tle1}`);
}
```

- [ ] **Step 4: 提交**

```bash
git add backend-nest/src/modules/satellite-sync/satellite-sync.service.ts
git commit -m "feat: implement KeepTrack TLE sync service"
```

---

### Task 5: 实现 KeepTrack 元数据同步服务

**Files:**
- Modify: `backend-nest/src/modules/satellite-sync/satellite-sync.service.ts`

- [ ] **Step 1: 添加 KeepTrack 详情接口**

```typescript
interface KeepTrackSatDetailResponse {
  NORAD_CAT_ID: string;
  NAME: string;
  COUNTRY?: string;
  OWNER?: string;
  MANUFACTURER?: string;
  BUS?: string;
  LAUNCH_DATE?: string;
  LAUNCH_SITE?: string;
  LAUNCH_VEHICLE?: string;
  MISSION?: string;
  PURPOSE?: string;
  LENGTH?: string;
  DIAMETER?: string;
  SPAN?: string;
  DRY_MASS?: string;
  LAUNCH_MASS?: string;
  EQUIPMENT?: string;
  ADCS?: string;
  PAYLOAD?: string;
  CONSTELLATION_NAME?: string;
}
```

- [ ] **Step 2: 实现 syncKeepTrackDetail 方法**

```typescript
private async syncKeepTrackDetail(task: SatelliteSyncTaskEntity): Promise<void> {
  this.logger.log('开始 KeepTrack 元数据同步...');

  if (!this.keepTrackApiKey) {
    this.logger.warn('KeepTrack API Key 未配置，跳过元数据同步');
    return;
  }

  const satellites = await this.metadataRepository
    .createQueryBuilder('m')
    .select(['m.noradId'])
    .where('m.hasExtendedData = false')
    .limit(1000)
    .getRawMany<{ noradId: string }>();

  task.total = satellites.length;
  await this.taskRepository.save(task);

  let success = 0;
  for (const sat of satellites) {
    try {
      const url = `${this.keepTrackBaseUrl}/sat/${sat.noradId}`;
      const response = await fetch(url, {
        headers: { 'X-API-Key': this.keepTrackApiKey },
      });

      if (response.ok) {
        const detail: KeepTrackSatDetailResponse = await response.json();
        await this.saveKeepTrackMetadata(sat.noradId, detail);
        success++;
      }

      // 限流：1000 次/小时
      await this.sleep(3600);
    } catch (error) {
      this.logger.warn(`获取元数据失败 (${sat.noradId}): ${error.message}`);
    }

    task.processed++;
    task.success = success;
    await this.taskRepository.save(task);
  }
}
```

- [ ] **Step 3: 添加 saveKeepTrackMetadata 方法**

```typescript
private async saveKeepTrackMetadata(
  noradId: string,
  detail: KeepTrackSatDetailResponse
): Promise<void> {
  await this.metadataRepository.update(noradId, {
    name: detail.NAME,
    countryCode: detail.COUNTRY,
    operator: detail.OWNER,
    contractor: detail.MANUFACTURER,
    bus: detail.BUS,
    launchDate: detail.LAUNCH_DATE,
    launchSite: detail.LAUNCH_SITE,
    launchVehicle: detail.LAUNCH_VEHICLE,
    mission: detail.MISSION,
    purpose: detail.PURPOSE,
    length: detail.LENGTH ? parseFloat(detail.LENGTH) : undefined,
    diameter: detail.DIAMETER ? parseFloat(detail.DIAMETER) : undefined,
    span: detail.SPAN ? parseFloat(detail.SPAN) : undefined,
    dryMass: detail.DRY_MASS ? parseFloat(detail.DRY_MASS) : undefined,
    launchMass: detail.LAUNCH_MASS ? parseFloat(detail.LAUNCH_MASS) : undefined,
    equipment: detail.EQUIPMENT,
    adcs: detail.ADCS,
    payload: detail.PAYLOAD,
    constellationName: detail.CONSTELLATION_NAME,
    hasExtendedData: true,
  });
}
```

- [ ] **Step 4: 提交**

```bash
git add backend-nest/src/modules/satellite-sync/satellite-sync.service.ts
git commit -m "feat: implement KeepTrack metadata sync service"
```

---

### Task 6: 修改同步执行逻辑支持多数据源

**Files:**
- Modify: `backend-nest/src/modules/satellite-sync/satellite-sync.service.ts`

- [ ] **Step 1: 修改 executeSync 方法**

```typescript
private async executeSync(task: SatelliteSyncTaskEntity): Promise<void> {
  try {
    switch (task.type) {
      case 'celestrak':
        await this.syncCelestrak(task);
        break;
      case 'space-track':
        await this.syncTle(task);
        break;
      case 'keeptrack-tle':
        await this.syncKeepTrackBrief(task);
        break;
      case 'keeptrack-meta':
        await this.syncKeepTrackDetail(task);
        break;
      case 'discos':
        await this.syncDiscos(task);
        break;
      case 'all':
        await this.syncCelestrak(task);
        await this.syncTle(task);
        await this.syncKeepTrackBrief(task);
        await this.syncKeepTrackDetail(task);
        await this.syncDiscos(task);
        break;
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await this.taskRepository.save(task);
  } catch (error) {
    task.status = 'failed';
    task.error = error.message;
    await this.taskRepository.save(task);
  } finally {
    this.currentTask = null;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add backend-nest/src/modules/satellite-sync/satellite-sync.service.ts
git commit -m "feat: support multi-source sync execution"
```

---

### Task 7: 修改 getStats 支持多数据源统计

**Files:**
- Modify: `backend-nest/src/modules/satellite-sync/satellite-sync.service.ts`

- [ ] **Step 1: 修改 getStats 方法**

```typescript
async getStats(): Promise<SyncStatsResponse> {
  const tleCount = await this.tleRepository.count();
  const metadataCount = await this.metadataRepository.count();
  const discosCount = await this.metadataRepository.count({ where: { hasDiscosData: true } });

  const celestrakCount = await this.tleRepository.count({ where: { source: 'celestrak' } });
  const keepTrackCount = await this.tleRepository.count({ where: { source: 'keeptrack' } });

  const lastCelestrakTask = await this.taskRepository.findOne({
    where: { type: 'celestrak', status: 'completed' },
    order: { completedAt: 'DESC' },
  });

  const lastKeepTrackTask = await this.taskRepository.findOne({
    where: { type: 'keeptrack-tle', status: 'completed' },
    order: { completedAt: 'DESC' },
  });

  return {
    tleCount,
    metadataCount,
    discosCount,
    discosCoverage: metadataCount > 0 ? ((discosCount / metadataCount) * 100).toFixed(1) + '%' : '0%',
    celestrakCount,
    keepTrackCount,
    lastTleSync: undefined,
    lastDiscosSync: undefined,
    lastCelestrakSync: lastCelestrakTask?.completedAt?.toISOString(),
    lastKeepTrackSync: lastKeepTrackTask?.completedAt?.toISOString(),
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add backend-nest/src/modules/satellite-sync/satellite-sync.service.ts
git commit -m "feat: add multi-source statistics to getStats"
```

---

### Task 8: 数据库迁移和测试

**Files:**
- 执行 SQL 迁移

- [ ] **Step 1: 运行数据库迁移**

```bash
psql -h localhost -U postgres -d nova_space -f backend-nest/src/database/migrations/add-source-to-tle.sql
```

- [ ] **Step 2: 验证表结构**

```sql
\d satellite_tle
SELECT source, COUNT(*) FROM satellite_tle GROUP BY source;
```

- [ ] **Step 3: 启动服务测试**

```bash
cd backend-nest
pnpm run start:dev
```

- [ ] **Step 4: 测试各数据源同步**

```bash
# CelesTrak
curl -X POST http://localhost:3002/api/satellite-sync -H "Content-Type: application/json" -d '{"type":"celestrak"}'

# Space-Track
curl -X POST http://localhost:3002/api/satellite-sync -H "Content-Type: application/json" -d '{"type":"space-track"}'

# KeepTrack (应跳过，因为无 API Key)
curl -X POST http://localhost:3002/api/satellite-sync -H "Content-Type: application/json" -d '{"type":"keeptrack-tle"}'

# ESA DISCOS
curl -X POST http://localhost:3002/api/satellite-sync -H "Content-Type: application/json" -d '{"type":"discos"}'
```

---

## 自审检查

### 1. Spec 覆盖率
- [x] CelesTrak TLE 同步 — Task 3
- [x] Space-Track TLE 同步 — 已有代码
- [x] KeepTrack TLE 同步 — Task 4
- [x] KeepTrack 元数据同步 — Task 5
- [x] ESA DISCOS 元数据同步 — 已有代码
- [x] source 字段 — Task 2
- [x] 多数据源统计 — Task 7

### 2. 类型一致性
- `SyncType` 在所有文件中定义一致
- `SyncStatsResponse` 包含所有统计字段

### 3. 无占位符
- 所有代码完整
- 无 TBD/TODO

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-03-29-multi-source-satellite-sync.md`.**

**两种执行选项:**

**1. Subagent-Driven（推荐）** - 每个任务由独立的 subagent 执行，任务之间我会 review，迭代快

**2. Inline Execution** - 在当前会话中使用 executing-plans 技能执行，批量执行带检查点

**Which approach?**
