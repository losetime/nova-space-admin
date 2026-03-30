# CelesTrak "Active Satellites" 官方定义调研

**调研日期**: 2026-03-28
**来源**: https://celestrak.org/satcat/status.php

---

## 关键发现

### CelesTrak "Active"的定义

根据 CelesTrak 官方文档：

> **"Active is any satellite with an operational status of +, P, B, S, or X."**
>
> **"Active status does not require power or communications (e.g., geodetic satellites)"**

**Operational Status 代码含义**：
| 代码 | 含义 |
|------|------|
| + | Operational |
| P | Partially Operational |
| B | Backup/Standby |
| S | Spare/Storage |
| X | Non-Functional |

---

### CelesTrak 分类统计（当前数据）

| 类别 | 数量 |
|------|------|
| **Active Satellites** | **14,879** |
| Dead Satellites | 2,910 |
| Rocket Bodies | 2,266 |
| Debris | 12,553 |
| Unknown | 60 |
| **All Objects** | **29,931** |

---

## 重要结论

### 1. `GROUP=active` 包含什么？

**`GROUP=active` = 所有"Operational Status"为 +, P, B, S, X 的卫星**

这意味着：
- ✅ **包含**：正常工作的卫星、部分工作的卫星、备份卫星、储存卫星、甚至非功能卫星
- ✅ **包含**：地球物理/测地卫星（如 CALSPHERE，即使没有电源和通信也算 active）
- ❌ **不包含**：Dead Satellites（已死亡的卫星）
- ❌ **不包含**：Rocket Bodies（火箭本体，单独分类）
- ❌ **不包含**：Debris（碎片，单独分类）

### 2. `GROUP=active` 是否包含 Rocket Body 和 Debris？

**答案：不包含！**

根据 CelesTrak 的分类：
- **Active Satellites** (14,879) — 单独分类
- **Rocket Bodies** (2,266) — 单独分类
- **Debris** (12,553) — 单独分类

这三个是**互斥**的分类！

### 3. 是否包含"有效载荷"（Payload）？

**`GROUP=active` 包含的是"Active Satellites"，而不是"Active Payloads"**

区别在于：
- **Active Satellites** = 所有有 operational status 的卫星（包括测地卫星、校准球等）
- **Active Payloads** = 仅有效载荷（排除火箭本体、碎片，也排除非载荷卫星）

根据 CelesTrak 的 SATCAT 分类，"Payload"是一个单独的物体类型分类：
- Payload（有效载荷）
- Rocket Body（火箭本体）
- Debris（碎片）

**`GROUP=active` 按 Operational Status 筛选，而不是按 Object Type 筛选**

---

## 与其他数据源的对比

### Space-Track

Space-Track 可以同时按 **Object Type** 和 **Operational Status** 筛选：

```
/basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/decay_date/null-val
```

这个查询返回：**没有衰变的活跃有效载荷**（排除火箭本体、碎片、校准球等）

### KeepTrack

KeepTrack 有 `TYPE` 字段和 `STATUS` 字段：
- `TYPE` — 物体类型（类似 Payload/Rocket Body/Debris）
- `STATUS` — 运行状态（Active/Inactive）

---

## 对需求的启示

### 如果用户想要"活跃载荷"（Active Payloads only）

**CelesTrak `GROUP=active` 不能满足需求**，因为：
1. 它包含非载荷卫星（如测地卫星、校准球）
2. 它按 Operational Status 筛选，不是按 Object Type 筛选

**正确的方案**：
1. **CelesTrak** — 获取 `GROUP=active`，然后在本地过滤（需要 SATCAT 数据）
2. **Space-Track** — 直接查询 `OBJECT_TYPE/PAYLOAD/decay_date/null-val`
3. **KeepTrack** — 查询 `TYPE` + `STATUS=Active`

---

## 数据来源

- https://celestrak.org/satcat/status.php
- https://celestrak.org/NORAD/elements/
- https://celestrak.org/satcat/

---

## 更新历史

| 日期 | 内容 |
|------|------|
| 2026-03-28 | 确认 CelesTrak Active 定义，不包含 Rocket Body 和 Debris |
