# 卫星数据源字段对比

## 重要发现

### CelesTrak 的 Payload 筛选
经过验证，CelesTrak **没有** `GROUP=payloads` 参数。但有以下相关分类：
- `GROUP=active` - 所有活跃卫星（包含 payload、rocket body、debris 等）
- 没有直接的 `FILTER=PAYLOAD` 参数

**获取 Payload 的方法**：
1. 从 CelesTrak 获取 `active` 数据
2. 从 Space-Track 的 `OBJECT_TYPE/PAYLOAD` 筛选
3. 或从 KeepTrack 的 `TYPE` 字段判断

---

## 1. CelesTrak (JSON 格式)

**API 端点**: `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json`

**TLE 字段**:
```json
{
  "OBJECT_NAME": "DMSP 5D-3 F16 (USA 172)",
  "OBJECT_ID": "2003-048A",
  "EPOCH": "2026-03-27T20:58:40.999296",
  "MEAN_MOTION": 14.14468976,
  "ECCENTRICITY": 0.0007428,
  "INCLINATION": 98.997,
  "RA_OF_ASC_NODE": 110.1374,
  "ARG_OF_PERICENTER": 26.1395,
  "MEAN_ANOMALY": 323.9281,
  "EPHEMERIS_TYPE": 0,
  "CLASSIFICATION_TYPE": "U",
  "NORAD_CAT_ID": 28054,
  "ELEMENT_SET_NO": 999,
  "REV_AT_EPOCH": 15798,
  "BSTAR": 0.00010407,
  "MEAN_MOTION_DOT": 1.54e-6,
  "MEAN_MOTION_DDOT": 0
}
```

**可用分类 (GROUP 参数)**:
- active - 活跃卫星
- weather - 气象卫星
- noaa - NOAA 系列
- goes - GOES 系列
- weather - 气象
- resource - 资源探测
- sarsat - 搜救卫星
- dmc - 灾害监测
- tdrs - 跟踪与数据中继
- cube - 立方星
- beacon - 信标
- visible - 可见光
- radar - 雷达
- calibration - 校准
- history - 历史卫星
- gps-ops - GPS 运行
- glo-ops - GLONASS 运行
- gal-ops - Galileo 运行
- geo - 地球静止轨道
- geo-protected - 受保护的地球静止轨道
- anatolia - Anatolia
-星链 (starlink) 等商业星座

**优点**:
- 免费，无需 API Key
- JSON 格式易于解析
- 分类详细，可以按用途筛选
- 数据更新频繁（每 2 小时）

**缺点**:
- 只有 TLE 数据，无扩展元数据
- 没有国家、运营商、制造商等信息

---

## 2. Space-Track API

**API 端点**: `https://www.space-track.org/basicspacedata/query/class/gp/...`

**GP 数据字段**:
```json
{
  "OBJECT_NAME": "string",
  "OBJECT_ID": "string",
  "NORAD_CAT_ID": "string",
  "EPOCH": "string",
  "TLE_LINE0": "string",
  "TLE_LINE1": "string",
  "TLE_LINE2": "string",
  "COUNTRY_CODE": "string",      // 国家代码
  "LAUNCH_DATE": "string",       // 发射日期
  "SITE": "string",              // 发射场
  "OBJECT_TYPE": "string",       // 物体类型
  "RCS_SIZE": "string",          // 雷达散射截面
  "DECAY_DATE": "string|null",   // 衰变日期
  "INCLINATION": "string",
  "ECCENTRICITY": "string",
  "RA_OF_ASC_NODE": "string",
  "ARG_OF_PERICENTER": "string",
  "MEAN_MOTION": "string",
  "APOAPSIS": "string",          // 远地点
  "PERIAPSIS": "string",         // 近地点
  "PERIOD": "string"             // 周期
}
```

**优点**:
- 数据最权威，是 CelesTrak 的数据源
- 包含基础元数据（国家、发射日期等）
- 可以查询更多特殊分类

**缺点**:
- 需要账号登录（有封号风险）
- 限流严格（~30 请求/分钟）
- 元数据字段相对较少

---

## 3. KeepTrack.space API

**API 端点**:
- TLE: `https://api.keeptrack.space/v4/sats/brief`
- 详情：`https://api.keeptrack.space/v4/sat/{id}`

**Brief 响应 (TLE + 基础信息)**:
```json
{
  "tle1": "1 25544U...",
  "tle2": "2 25544...",
  "type": 0,
  "name": "ISS",
  "altName": "ZARYA",
  "purpose": "Space Station",
  "vmag": 2.5,
  "launchDate": "1998-11-20",
  "country": "USA",
  "rcs": "Large",
  "status": "Active",
  "source": "CelesTrak"
}
```

**Satellite Detail 响应 (扩展元数据)**:
```json
{
  "NORAD_CAT_ID": "25544",
  "OBJECT_ID": "1998-067A",
  "NAME": "ISS",
  "ALT_NAME": "ZARYA",
  "COUNTRY": "USA",
  "OWNER": "NASA/Roscosmos",        // 运营商
  "MANUFACTURER": "Boeing/etc",     // 制造商
  "BUS": "",                        // 卫星平台
  "CONFIGURATION": "",
  "MOTOR": "",
  "POWER": "Solar arrays",
  "LENGTH": "73",
  "DIAMETER": "",
  "SPAN": "109",                    // 翼展
  "DRY_MASS": "420000",
  "LAUNCH_DATE": "1998-11-20",
  "STABLE_DATE": "",
  "LAUNCH_MASS": "",
  "LAUNCH_SITE": "Baikonur",
  "LAUNCH_PAD": "",
  "LAUNCH_VEHICLE": "Proton",
  "LIFETIME": "15 years",
  "MISSION": "Space Station",
  "PURPOSE": "Manned Spaceflight",
  "EQUIPMENT": "",
  "PAYLOAD": "",
  "ADCS": "",
  "RCS": "Large",
  "SHAPE": "",
  "STATUS": "Active",
  "TYPE": 0,
  "VMAG": 2.5,
  "CONSTELLATION_NAME": "",
  "TLE_LINE_1": "1 25544...",
  "TLE_LINE_2": "2 25544...",
  "EPOCH": "2026-03-27T12:00:00Z",
  "INCLINATION": 51.64,
  "RA_OF_ASC_NODE": 123.45,
  "MEAN_MOTION": 15.5,
  "ARG_OF_PERICENTER": 123.45,
  "MEAN_ANOMALY": 234.56
}
```

**优点**:
- 单个 API 同时提供 TLE 和扩展元数据
- 元数据字段最丰富（运营商、制造商、尺寸、质量等）
- 无需登录，只需 API Key（免费获取）
- 限流宽松（1000 次/小时）

**缺点**:
- 需要 API Key
- 元数据同步需要逐条请求（耗时较长）

---

## 4. ESA DISCOS API

**API 端点**: `https://discosweb.esoc.esa.int/api/objects?filter=satno={noradId}`

**响应字段**:
```json
{
  "data": [{
    "id": "12345",
    "type": "object",
    "attributes": {
      "cosparId": "1998-067A",
      "satno": 25544,
      "name": "ISS",
      "objectClass": "Payload",
      "mass": 420000,
      "shape": "Complex",
      "width": 73,
      "height": 20,
      "depth": 20,
      "span": 109,
      "mission": "Space Station",
      "firstEpoch": "1998-11-20",
      "predDecayDate": "2030-01-01"
    },
    "relationships": {
      "operators": {
        "data": [{"type": "organisation", "id": "123"}]
      },
      "launch": {
        "data": {"type": "launch", "id": "456"}
      }
    }
  }],
  "included": [{
    "type": "organisation",
    "id": "123",
    "attributes": {
      "name": "NASA"
    }
  }, {
    "type": "launch",
    "id": "456",
    "attributes": {
      "flightNo": "1",
      "cosparLaunchNo": "1998-067",
      "failure": false
    },
    "relationships": {
      "vehicle": {
        "data": {"type": "vehicle", "id": "789"}
      },
      "site": {
        "data": {"type": "launchSite", "id": "101"}
      }
    }
  }]
}
```

**优点**:
- 欧洲航天局官方数据
- 元数据质量高（质量、尺寸、任务信息）
- 包含发射信息和运营商

**缺点**:
- 需要 API Token
- 限流严格
- 数据覆盖率不如 KeepTrack
- 用户账号被封

---

## 字段映射对比

| 概念 | CelesTrak | Space-Track | KeepTrack | ESA DISCOS |
|------|-----------|-------------|-----------|------------|
| NORAD ID | `NORAD_CAT_ID` | `NORAD_CAT_ID` | `NORAD_CAT_ID` | `satno` |
| 卫星名称 | `OBJECT_NAME` | `OBJECT_NAME` | `NAME` | `name` |
| 国际编号 | `OBJECT_ID` | `OBJECT_ID` | `OBJECT_ID` | `cosparId` |
| EPOCH | `EPOCH` | `EPOCH` | `EPOCH` | - |
| TLE Line1 | - | `TLE_LINE1` | `TLE_LINE_1` | - |
| TLE Line2 | - | `TLE_LINE2` | `TLE_LINE_2` | - |
| 国家 | - | `COUNTRY_CODE` | `COUNTRY` | - |
| 发射日期 | - | `LAUNCH_DATE` | `LAUNCH_DATE` | - |
| 发射场 | - | `SITE` | `LAUNCH_SITE` | `launch.site.name` |
| 发射载具 | - | - | `LAUNCH_VEHICLE` | `launch.vehicle.name` |
| 运营商 | - | - | `OWNER` | `operators[].name` |
| 制造商 | - | - | `MANUFACTURER` | - |
| 质量 | - | - | `LAUNCH_MASS`, `DRY_MASS` | `mass` |
| 尺寸 | - | - | `LENGTH`, `DIAMETER`, `SPAN` | `width`, `height`, `depth`, `span` |
| 任务类型 | - | - | `MISSION`, `PURPOSE` | `mission` |
| 物体类型 | - | `OBJECT_TYPE` | `TYPE` | `objectClass` |
| RCS | - | `RCS_SIZE` | `RCS` | - |
| 状态 | - | - | `STATUS` | - |

---

## 有效载荷（Payload）筛选能力

### CelesTrak
- 有明确的分类：`active` 包含所有活跃卫星
- 可以通过 `GROUP=active` 获取活跃卫星
- 但**没有专门的 `payload` 分类**
- 需要自己根据卫星类型判断是否为 payload

### Space-Track
- 可以通过 `OBJECT_TYPE/PAYLOAD` 筛选
- 查询示例：`/class/gp/OBJECT_TYPE/PAYLOAD/decay_date/null-val/epoch/>now-10`
- **可以准确筛选 payload**

### KeepTrack
- `TYPE` 字段区分卫星类型
- 但没有明确的文档说明 TYPE=0 是 payload
- 可以通过 `PURPOSE` 字段筛选科学/通信卫星

### ESA DISCOS
- `objectClass` 字段包含 "Payload" 值
- **可以准确筛选 payload**

---

## 结论

1. **TLE 数据源优先级**: CelesTrak → Space-Track → KeepTrack
   - CelesTrak 免费且稳定，作为首选
   - 但 CelesTrak 无法单独筛选 payload，需要结合其他源

2. **Payload 筛选**:
   - 如果需要精确的 payload 筛选，Space-Track 和 ESA DISCOS 更可靠
   - KeepTrack 的 `TYPE` 字段可能需要验证

3. **元数据**: KeepTrack 字段最完整，作为主数据源

4. **建议**:
   - TLE: CelesTrak 优先（免费稳定）
   - Payload 标记：需要从 Space-Track 或 KeepTrack 获取 `OBJECT_TYPE`/`TYPE` 字段
   - 元数据：KeepTrack 为主
