-- 修改 membership_plans 和 users 表的 level 字段从枚举改为 varchar
-- 以支持从会员管理动态获取的等级

-- 1. 修改 membership_plans 表
ALTER TABLE membership_plans 
ALTER COLUMN level TYPE VARCHAR(50);

-- 2. 修改 users 表
ALTER TABLE users 
ALTER COLUMN level TYPE VARCHAR(50);

-- 3. 删除旧的枚举类型（如果存在）
DROP TYPE IF EXISTS membership_plan_level;
DROP TYPE IF EXISTS user_level;