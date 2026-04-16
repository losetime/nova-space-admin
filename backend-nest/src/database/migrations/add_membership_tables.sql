-- Membership System Incremental Migration
-- Run this script on existing database to add membership tables and update enums

-- 1. Update notification_type enum to add 'membership'
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'membership';

-- 2. Update points_action enum to add 'points_exchange_member'
ALTER TYPE "public"."points_action" ADD VALUE IF NOT EXISTS 'points_exchange_member';

-- 3. Create membership_plans table
CREATE TABLE IF NOT EXISTS "membership_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "plan_code" varchar(50) NOT NULL,
  "duration_months" integer NOT NULL,
  "level" "user_level" NOT NULL,
  "price" numeric(10, 2) NOT NULL,
  "points_price" integer,
  "description" text,
  "features" jsonb,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "membership_plans_plan_code_unique" UNIQUE("plan_code")
);

-- 4. Create membership_benefits table
CREATE TABLE IF NOT EXISTS "membership_benefits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "level" "user_level" NOT NULL,
  "benefit_type" varchar(50) NOT NULL,
  "benefit_value" text NOT NULL,
  "description" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Create unique index on membership_benefits
CREATE UNIQUE INDEX IF NOT EXISTS "membership_benefits_level_type_idx" 
ON "membership_benefits" USING btree ("level", "benefit_type");

-- 6. Insert default membership plans
INSERT INTO "membership_plans" ("name", "plan_code", "duration_months", "level", "price", "points_price", "description", "sort_order") VALUES
('月卡', 'monthly', 1, 'advanced', 29.00, 500, '高级会员月卡，享受高级情报内容访问权限', 1),
('季卡', 'quarterly', 3, 'advanced', 79.00, 1200, '高级会员季卡，享受高级情报内容访问权限', 2),
('年卡', 'yearly', 12, 'advanced', 199.00, 3000, '高级会员年卡，享受高级情报内容访问权限', 3),
('永久卡', 'lifetime', 1200, 'professional', 999.00, NULL, '专业会员永久卡，享受所有内容访问权限', 4)
ON CONFLICT ("plan_code") DO NOTHING;

-- 7. Insert default membership benefits
INSERT INTO "membership_benefits" ("level", "benefit_type", "benefit_value", "description") VALUES
('basic', 'content_access', '{"levels": ["free"]}', '仅可访问免费内容'),
('basic', 'push_quota', '3', '每日推送限制3次'),
('basic', 'points_multiplier', '1.0', '积分获取倍数1.0'),
('advanced', 'content_access', '{"levels": ["free", "advanced"]}', '可访问免费和高级内容'),
('advanced', 'push_quota', '10', '每日推送限制10次'),
('advanced', 'points_multiplier', '1.2', '积分获取倍数1.2'),
('professional', 'content_access', '{"levels": ["free", "advanced", "professional"]}', '可访问所有内容'),
('professional', 'push_quota', '20', '每日推送限制20次'),
('professional', 'points_multiplier', '1.5', '积分获取倍数1.5')
ON CONFLICT ("level", "benefit_type") DO NOTHING;