# 会员系统实现规划

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                           共享数据库                                  │
│  users | subscriptions | points_records | membership_plans | benefits │
└─────────────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
┌────────────────────────┐    ┌────────────────────────┐
│   客户端后端 (3001)     │    │   管理后台后端 (3002)    │
│  - subscription模块     │    │  - membership模块       │
│  - points模块          │    │  (新增)                 │
│  - 积分兑换会员(新增)   │    │  - 套餐管理             │
│  - 定时任务(完善)       │    │  - 权益配置             │
│  - 支付对接(预留)       │    │  - 订阅管理             │
└────────────────────────┘    └────────────────────────┘
         ↑                                    ↑
         │                                    │
┌────────────────────────┐    ┌────────────────────────┐
│   客户端前端 (5174)     │    │   管理后台前端 (5180)   │
│  - 会员中心页面         │    │  - 套餐管理页面         │
│  - 购买/续费/积分兑换   │    │  - 权益配置页面         │
│  - 会员权益展示         │    │  - 订阅记录管理         │
└────────────────────────┘    └────────────────────────┘
```

## 二、数据库扩展

### 2.1 新增表

#### membership_plans（会员套餐定义）

```sql
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,              -- 套餐名称：月卡/季卡/年卡/永久卡
  plan_code VARCHAR(50) NOT NULL UNIQUE,   -- 套餐代码：monthly/quarterly/yearly/lifetime
  duration_months INTEGER NOT NULL,        -- 有效期月数（lifetime=100年）
  level VARCHAR(20) NOT NULL,              -- 对应用户等级：advanced/professional
  price DECIMAL(10,2) NOT NULL,            -- 原价（CNY）
  points_price INTEGER,                    -- 积分兑换价（可选，null表示不可积分兑换）
  description TEXT,                        -- 套餐描述
  features JSONB,                          -- 权益列表：{contentAccess, pushLimit, ...}
  is_active BOOLEAN DEFAULT true,          -- 是否上架
  sort_order INTEGER DEFAULT 0,            -- 排序
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### membership_benefits（会员权益配置）

```sql
CREATE TABLE membership_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(20) NOT NULL,              -- 用户等级：basic/advanced/professional
  benefit_type VARCHAR(50) NOT NULL,       -- 权益类型：content_access/push_quota/points_multiplier
  benefit_value TEXT NOT NULL,             -- 权益值（JSON或数值）
  description VARCHAR(255),                -- 权益描述
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(level, benefit_type)
);
```

### 2.2 现有表补充

- **subscriptions表**：已满足需求，无需改动
- **points_records表**：新增 action类型：`points_exchange_member`
- **notifications表**：新增 type类型：`membership`

## 三、功能划分

### 3.1 客户端（nova-space-client）

| 功能 | 模块 | API | 状态 |
|------|------|-----|------|
| 查看当前订阅 | subscription | GET `/subscriptions/current` | ✅ 已有 |
| 订阅历史 | subscription | GET `/subscriptions/history` | ✅ 已有 |
| 购买会员 | subscription | POST `/subscriptions` | ✅ 已有 |
| 续费 | subscription | POST `/subscriptions/renew` | ✅ 已有 |
| 取消订阅 | subscription | PUT `/subscriptions/cancel` | ✅ 已有 |
| 获取套餐列表 | subscription | GET `/subscriptions/plans` | ❌ 新增 |
| 检查会员状态 | subscription | GET `/subscriptions/status` | ❌ 新增 |
| 自动续费设置 | subscription | PUT `/subscriptions/auto-renew` | ❌ 新增 |
| 积分兑换会员 | points | POST `/points/exchange-membership` | ❌ 新增 |
| 积分余额/历史 | points | GET `/points/stats`, `/points/history` | ✅ 已有 |
| 每日签到 | points | POST `/points/daily-checkin` | ✅ 已有 |

### 3.2 管理后台（nova-space-admin）

| 功能 | 模块 | API | 状态 |
|------|------|-----|------|
| 套餐列表 | membership | GET `/membership/plans` | ❌ 新增 |
| 创建套餐 | membership | POST `/membership/plans` | ❌ 新增 |
| 更新套餐 | membership | PUT `/membership/plans/:id` | ❌ 新增 |
| 删除套餐 | membership | DELETE `/membership/plans/:id` | ❌ 新增 |
| 权益列表 | membership | GET `/membership/benefits` | ❌ 新增 |
| 创建权益 | membership | POST `/membership/benefits` | ❌ 新增 |
| 更新权益 | membership | PUT `/membership/benefits/:id` | ❌ 新增 |
| 删除权益 | membership | DELETE `/membership/benefits/:id` | ❌ 新增 |
| 所有订阅记录 | membership | GET `/membership/subscriptions` | ❌ 新增 |
| 订阅详情 | membership | GET `/membership/subscriptions/:id` | ❌ 新增 |
| 手动开通会员 | membership | POST `/membership/subscriptions/:id/activate` | ❌ 新增 |
| 取消订阅 | membership | POST `/membership/subscriptions/:id/cancel` | ❌ 新增 |
| 会员统计 | membership | GET `/membership/statistics` | ❌ 新增 |

## 四、通知系统扩展

### 4.1 新增通知类型

现有类型：`intelligence | system | achievement`

新增类型：`membership`

### 4.2 会员通知场景

| 场景 | 触发时机 | 标题 | 内容示例 | relatedType |
|------|----------|------|----------|-------------|
| 会员开通成功 | 支付成功/积分兑换成功 | 会员开通成功 | 您已成功开通[月卡]会员，有效期至XXXX-XX-XX | subscription |
| 会员到期提醒 | 到期前7天/3天/1天 | 会员即将到期 | 您的会员将在X天后到期，请及时续费 | subscription |
| 会员已过期 | 到期当天 | 会员已过期 | 您的会员已过期，部分权益已降级 | subscription |
| 续费成功 | 自动续费/手动续费成功 | 续费成功 | 您的会员已续费成功，新有效期至XXXX-XX-XX | subscription |
| 续费失败 | 自动续费扣款失败 | 续费失败 | 自动续费扣款失败，请手动续费 | subscription |
| 积分兑换成功 | 积分兑换会员成功 | 积分兑换成功 | 您已使用X积分兑换[月卡]会员 | subscription |
| 管理员调整会员 | 后台手动开通/延长 | 会员权益变更 | 您的会员权益已由管理员调整 | subscription |
| 会员等级变更 | 升级/降级 | 会员等级变更 | 您的会员等级已变更为[高级会员] | user |
| 积分获得 | 签到/答题/购买 | 积分获得 | 您获得了X积分（来源：每日签到） | points_record |
| 积分消费 | 积分兑换会员 | 积分消费 | 您消费了X积分用于兑换会员 | points_record |

## 五、数据流闭环

### 5.1 用户购买会员流程

```
用户选择套餐 → 调用支付接口 → 支付成功回调 → 
创建订阅记录(status=active) → 更新用户level → 发送通知 → 
用户获得内容访问权限
```

### 5.2 积分兑换会员流程

```
用户选择可积分兑换套餐 → 检查积分是否足够 → 
扣减积分(记录流水) → 创建订阅记录 → 更新用户level → 
发送积分消费通知 + 会员开通通知 → 用户获得内容访问权限
```

### 5.3 会员到期流程

```
定时任务每日检查 → 发现过期订阅 → 
更新订阅status=expired → 更新用户level=basic → 
发送过期通知 → 用户权限降级
```

### 5.4 到期提醒流程

```
定时任务检查 → 发现即将过期订阅(7天/3天/1天) → 
发送到期提醒通知 → 用户收到提醒
```

### 5.5 自动续费流程

```
定时任务检查即将过期订阅 → autoRenew=true → 尝试扣款 → 
成功：延长endDate + 发送续费成功通知 → 
失败：发送续费失败通知 + 关闭autoRenew
```

### 5.6 管理员手动调整流程

```
管理员查看用户订阅 → 手动开通/延长 → 
创建/更新订阅记录 → 更新用户level → 
发送变更通知 → 用户权限变更
```

## 六、新增文件清单

### 6.1 客户端后端（nova-space-client/backend-nest）

```
src/db/schema.ts                     # 新增 membershipPlans、membershipBenefits 表定义
src/modules/subscription/
  ├── subscription.service.ts        # 新增 getPlans()、getMembershipStatus()
  ├── subscription.controller.ts     # 新增 GET /plans、GET /status
  └── dto/subscription.dto.ts        # 新增 PointsExchangeDto
src/modules/points/
  ├── points.service.ts              # 新增 exchangeMembership()
  ├── points.controller.ts           # 新增 POST /exchange-membership
  └── dto/points.dto.ts              # 新增 ExchangeMembershipDto
src/modules/notification/
  ├── notification.service.ts        # 新增 sendMembershipNotification()、sendPointsNotification()
src/modules/membership-scheduler/
  ├── membership-scheduler.module.ts # 新建
  ├── membership-scheduler.service.ts # 新建：过期检查、到期提醒、自动续费定时任务
src/app.module.ts                    # 导入 MembershipSchedulerModule
```

### 6.2 客户端前端（nova-space-client/frontend）

```
src/views/MembershipView.vue         # 新建：会员中心页面
src/views/ProfileView.vue            # 修改：添加会员状态卡片
src/components/NotificationIcon.vue  # 修改：新增 membership 类型图标、跳转逻辑
src/api/index.ts                     # 新增 membershipApi、积分兑换API
src/router/index.ts                  # 新增 /membership 路由
src/stores/user.ts                   # 修改：添加会员状态字段
```

### 6.3 管理后台后端（nova-space-admin/backend-nest）

```
src/database/schema/
  ├── membership-plans.ts            # 新建：套餐表schema
  ├── membership-benefits.ts         # 新建：权益表schema
  └── index.ts                       # 导出新增表
src/modules/membership/
  ├── membership.module.ts           # 新建
  ├── membership.controller.ts       # 新建
  ├── membership.service.ts          # 新建
  └── dto/
      ├── create-plan.dto.ts         # 新建
      ├── update-plan.dto.ts         # 新建
      ├── create-benefit.dto.ts      # 新建
      ├── query-subscription.dto.ts  # 新建
      └── admin-subscription.dto.ts  # 新建
src/app.module.ts                    # 导入 MembershipModule
```

### 6.4 管理后台前端（nova-space-admin/frontend）

```
src/views/MembershipPlansView.vue    # 新建：套餐管理页面
src/views/MembershipBenefitsView.vue # 新建：权益配置页面
src/views/MembershipSubscriptionsView.vue # 新建：订阅记录管理
src/views/UserEditView.vue           # 修改：添加会员信息卡片
src/api/index.ts                     # 新增 membershipApi
src/router/index.ts                  # 新增路由
```

## 七、实现顺序

| Phase | 内容 | 涉及项目 |
|-------|------|----------|
| Phase 1 | 数据库表创建 + schema定义 | client + admin |
| Phase 2 | NotificationService 新增会员通知方法 | client |
| Phase 3 | 管理后台：套餐管理模块 | admin |
| Phase 4 | 管理后台：权益配置模块 | admin |
| Phase 5 | 管理后台：订阅管理 + 手动开通 | admin |
| Phase 6 | 客户端：套餐列表API + 积分兑换会员 | client |
| Phase 7 | 客户端：定时任务完善（过期检查+到期提醒） | client |
| Phase 8 | 客户端前端：会员中心页面 + 通知组件更新 | client |
| Phase 9 | 支付接口对接（预留扩展） | client |

## 八、注意事项

1. **两个后端共享数据库**：新增表需要在两个项目的 schema 中同步定义
2. **用户level同步**：订阅创建/过期时必须同步更新 `users.level`
3. **积分流水完整**：所有积分变动必须记录 `points_records`
4. **定时任务冲突**：过期检查只在 client 后端执行（admin 不执行）
5. **前端路由命名**：admin 的 `/subscriptions` 是邮件推送订阅，新会员订阅路由用 `/membership/subscriptions`
6. **通知推送**：所有会员变更、积分变动都需要推送到客户端通知栏

## 九、会员权益设计

### 9.1 权益类型

| benefit_type | 说明 | benefit_value 格式 |
|--------------|------|-------------------|
| content_access | 内容访问权限 | `{"levels": ["free", "advanced"]}` |
| push_quota | 每日推送次数限制 | `10` |
| points_multiplier | 积分获取倍数 | `1.5` |
| exclusive_features | 专属功能 | `["orbit_prediction", "pass_analysis"]` |
| daily_quiz_bonus | 每日答题额外积分 | `5` |

### 9.2 默认权益配置

| level | content_access | push_quota | points_multiplier |
|-------|----------------|------------|-------------------|
| basic | free | 3 | 1.0 |
| advanced | free, advanced | 10 | 1.2 |
| professional | free, advanced, professional | 20 | 1.5 |

### 9.3 默认套餐配置

| name | plan_code | duration_months | level | price | points_price |
|------|-----------|-----------------|-------|-------|--------------|
| 月卡 | monthly | 1 | advanced | 29.00 | 500 |
| 季卡 | quarterly | 3 | advanced | 79.00 | 1200 |
| 年卡 | yearly | 12 | advanced | 199.00 | 3000 |
| 永久卡 | lifetime | 1200 | professional | 999.00 | null |