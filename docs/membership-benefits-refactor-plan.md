# 会员权益系统重构计划

## 一、背景与需求

### 1.1 当前问题

现有 `membership_benefits` 表设计存在问题：
- `benefit_type` 为预设英文类型（如 content_access），管理员新增权益需要起英文名
- 权益与等级绑定在一起，不够独立灵活
- 不同等级的同一权益需要多条重复记录

### 1.2 需求目标

1. 权益独立管理：权益项可单独新增、编辑、删除
2. 等级可自定义：支持新增会员等级类型
3. 权益配置灵活：不同等级对同一权益配置不同值
4. 管理员友好：无需预设英文类型，全部中文操作

---

## 二、数据库表设计

### 2.1 benefits（权益表）

管理权益项本身，与等级无关。

```sql
CREATE TABLE benefits (
  id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,           -- 权益名称（如：每日推送次数）
  description VARCHAR(255),                    -- 权益描述
  value_type  VARCHAR(20) DEFAULT 'number',    -- 值类型：number/text/boolean
  unit        VARCHAR(50),                     -- 单位：次/天、倍
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| name | VARCHAR(100) | 权益名称（中文），如：每日推送次数 |
| description | VARCHAR(255) | 权益描述说明 |
| value_type | VARCHAR(20) | 值类型：number（数字）、text（文本）、boolean（布尔） |
| unit | VARCHAR(50) | 单位文字：次/天、倍、等 |

### 2.2 member_levels（会员等级表）

管理会员等级，支持自定义新增。

```sql
CREATE TABLE member_levels (
  id            VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50) NOT NULL UNIQUE,   -- 等级编码（basic/advanced/professional）
  name          VARCHAR(100) NOT NULL,         -- 等级名称（普通会员）
  description   VARCHAR(255),                  -- 等级描述
  icon          VARCHAR(10),                   -- 图标 emoji（⭐ 💎 👑）
  is_default    BOOLEAN DEFAULT FALSE,         -- 是否为默认等级
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| code | VARCHAR(50) | 等级编码，唯一，用于关联用户 |
| name | VARCHAR(100) | 等级名称（中文） |
| icon | VARCHAR(10) | 等级图标 emoji |
| is_default | BOOLEAN | 是否为默认等级（新用户自动分配） |

### 2.3 level_benefits（等级权益关联表）

不同等级对同一权益配置不同值。

```sql
CREATE TABLE level_benefits (
  id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id    VARCHAR(36) NOT NULL REFERENCES member_levels(id) ON DELETE CASCADE,
  benefit_id  VARCHAR(36) NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  value       VARCHAR(255) NOT NULL,           -- 权益值
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(level_id, benefit_id)
);
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| level_id | VARCHAR(36) | 关联会员等级 |
| benefit_id | VARCHAR(36) | 关联权益项 |
| value | VARCHAR(255) | 权益值（字符串存储） |

### 2.4 默认数据

```sql
-- 默认权益
INSERT INTO benefits (name, description, value_type, unit, sort_order) VALUES
('每日推送次数', '每日可接收推送通知的次数上限', 'number', '次/天', 1),
('积分获取倍率', '完成任务获得积分时的加成倍率', 'number', '倍', 2);

-- 默认等级
INSERT INTO member_levels (code, name, description, icon, is_default, sort_order) VALUES
('basic', '普通会员', '基础会员权益', '⭐', TRUE, 1),
('advanced', '高级会员', '高级会员权益', '💎', FALSE, 2),
('professional', '专业会员', '专业会员权益', '👑', FALSE, 3);

-- 默认权益配置（level_id 和 benefit_id 需替换为实际ID）
-- basic: 每日推送3次，积分倍率1.0
-- advanced: 每日推送10次，积分倍率1.2
-- professional: 每日推送20次，积分倍率1.5
```

### 2.5 删除旧表

```sql
DROP TABLE IF EXISTS membership_benefits;
```

---

## 三、管理后台 API 设计

### 3.1 权益管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/membership/benefits` | 获取权益列表 |
| POST | `/membership/benefits` | 新增权益 |
| PUT | `/membership/benefits/:id` | 编辑权益 |
| DELETE | `/membership/benefits/:id` | 删除权益 |

### 3.2 会员等级管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/membership/levels` | 获取等级列表（含权益配置） |
| GET | `/membership/levels/:id` | 获取单个等级详情 |
| POST | `/membership/levels` | 新增等级 |
| PUT | `/membership/levels/:id` | 编辑等级基本信息 |
| PUT | `/membership/levels/:id/benefits` | 批量配置等级权益 |
| DELETE | `/membership/levels/:id/benefits/:benefitId` | 移除单个权益 |
| DELETE | `/membership/levels/:id` | 删除等级 |

### 3.3 请求/响应结构

**新增权益请求：**
```json
{
  "name": "每日推送次数",
  "description": "每日推送上限",
  "value_type": "number",
  "unit": "次/天"
}
```

**新增等级请求：**
```json
{
  "name": "VIP会员",
  "code": "vip",
  "description": "VIP专属权益",
  "icon": "🏆",
  "is_default": false
}
```

**配置等级权益请求：**
```json
{
  "benefits": [
    { "benefit_id": "xxx", "value": "30" },
    { "benefit_id": "yyy", "value": "2.0" }
  ]
}
```

**获取等级列表响应：**
```json
{
  "data": [
    {
      "id": "xxx",
      "code": "basic",
      "name": "普通会员",
      "icon": "⭐",
      "is_default": true,
      "user_count": 150,
      "benefits": [
        { "id": "b1", "name": "每日推送次数", "value": "3", "unit": "次/天" },
        { "id": "b2", "name": "积分获取倍率", "value": "1.0", "unit": "倍" }
      ]
    }
  ]
}
```

---

## 四、前端页面设计

### 4.1 权益管理页面 `/membership/benefits

**页面布局：**
- 权益列表表格：名称、描述、值类型、单位、操作
- 新增权益弹窗：填写名称、描述、值类型、单位
- 编辑权益弹窗：修改权益信息
- 删除确认

### 4.2 会员管理页面 `/membership/levels`

**页面布局：**
- 等级卡片展示：图标、名称、已配置权益列表、默认标识
- 新增等级弹窗：名称（自动生成编码）、描述、图标、是否默认
- 编辑等级弹窗：
  - 基本信息编辑
  - 权益配置：已配置列表 + 添加权益选择器
- 删除确认：提示使用该等级的用户数

---

## 五、客户端接口适配

### 5.1 `/api/subscriptions/plans` 返回结构

```json
{
  "plans": [
    {
      "id": "xxx",
      "name": "月卡",
      "level": "advanced",
      "levelInfo": {
        "code": "advanced",
        "name": "高级会员",
        "icon": "💎"
      },
      "benefits": [
        { "id": "b1", "name": "每日推送次数", "value": "10", "unit": "次/天" },
        { "id": "b2", "name": "积分获取倍率", "value": "1.2", "unit": "倍" }
      ]
    }
  ]
}
```

### 5.2 `/api/subscriptions/status` 返回结构

```json
{
  "level": "advanced",
  "points": 150,
  "levelInfo": {
    "code": "advanced",
    "name": "高级会员",
    "icon": "💎"
  },
  "benefits": [
    { "id": "b1", "name": "每日推送次数", "value": "10", "unit": "次/天" },
    { "id": "b2", "name": "积分获取倍率", "value": "1.2", "unit": "倍" }
  ]
}
```

---

## 六、实现步骤

### Phase 1：数据库表创建（管理后台）
1. 创建迁移文件 `add_new_benefits_tables.sql`
2. 创建 benefits、member_levels、level_benefits 表
3. 插入默认数据
4. 删除旧 membership_benefits 表
5. 更新 schema 定义

### Phase 2：管理后台 API 开发
1. 创建 DTO 定义
2. 创建 Service 方法（权益CRUD、等级CRUD、权益配置）
3. 创建 Controller 路由

### Phase 3：管理后台前端开发
1. 创建权益管理页面 MembershipBenefitsView.vue
2. 创建会员管理页面 MembershipLevelsView.vue
3. 更新 API 定义
4. 更新路由和菜单

### Phase 4：客户端接口适配
1. 更新客户端 schema 定义
2. 修改 subscription.service.ts
3. 修改 intelligence.service.ts（使用权益配置获取内容访问权限）

### Phase 5：客户端前端适配
1. 更新 API 类型定义
2. 修改 MembershipView.vue
3. 修改 ProfileView.vue

---

## 七、业务规则

### 7.1 等级编码自动生成
- 根据等级名称自动生成编码
- 格式：小写字母 + 下划线
- 示例：VIP会员 → vip_member
- 可手动编辑调整
- 必须唯一，重复时自动追加数字（vip_1, vip_2）

### 7.2 默认等级规则
- 只能有一个默认等级
- 设置新默认等级时，自动取消旧默认等级
- 默认等级禁止删除
- 新用户注册自动分配默认等级

### 7.3 等级删除规则
- 有用户使用的等级禁止删除
- 提示信息：有 X 个用户使用该等级
- 不提供调整用户入口

### 7.4 权益值类型处理

| 类型 | 输入方式 | 存储格式 | 示例 |
|------|----------|----------|------|
| number | 数字输入框 | "10" 或 "1.5" | 每日推送次数 |
| text | 文本输入框 | "任意文本" | 专属客服电话 |
| boolean | 开关/单选 | "true" 或 "false" | 是否有专属客服 |

---

## 八、文件清单

### 管理后台后端
```
backend-nest/src/database/schema/
  - benefits.ts          (新建)
  - member-levels.ts     (新建)
  - level-benefits.ts    (新建)
  - index.ts             (更新)

backend-nest/src/database/migrations/
  - add_new_benefits_tables.sql  (新建)

backend-nest/src/modules/membership/
  - dto/benefit.dto.ts   (更新)
  - dto/level.dto.ts     (新建)
  - membership.service.ts (更新)
  - membership.controller.ts (更新)
```

### 管理后台前端
```
frontend/src/views/
  - MembershipBenefitsView.vue  (新建)
  - MembershipLevelsView.vue    (新建)

frontend/src/api/index.ts       (更新)
frontend/src/router/index.ts    (更新)
frontend/src/components/layout/AdminLayout.vue  (更新)
```

### 客户端后端
```
backend-nest/src/db/schema.ts   (更新)
backend-nest/src/modules/subscription/subscription.service.ts  (更新)
backend-nest/src/modules/intelligence/intelligence.service.ts  (更新)
```

### 客户端前端
```
frontend/src/api/index.ts       (更新)
frontend/src/views/MembershipView.vue  (更新)
frontend/src/views/ProfileView.vue     (更新)
```

---

## 九、注意事项

1. **情报查询性能**：使用权益配置获取内容访问权限，可考虑缓存用户权益
2. **编码唯一性**：新增等级时确保编码唯一
3. **权益值格式**：文本类型权益需约定格式规范
4. **兼容性**：users.level 字段保持不变，存储 member_levels.code 值