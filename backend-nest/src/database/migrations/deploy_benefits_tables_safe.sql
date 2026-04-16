-- ============================================
-- 会员权益系统重构 - 安全部署脚本
-- 执行顺序：按步骤逐一执行，确认无误后继续
-- ============================================

-- ==========================================
-- 步骤 1：备份旧表数据（如果存在）
-- ==========================================
-- 执行前先检查是否有数据需要备份
SELECT COUNT(*) as old_table_count FROM membership_benefits;

-- 如有数据，导出备份（可选）
-- COPY membership_benefits TO '/tmp/membership_benefits_backup.csv' WITH CSV HEADER;

-- ==========================================
-- 步骤 2：创建权益表 benefits
-- ==========================================
CREATE TABLE IF NOT EXISTS benefits (
  id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  value_type  VARCHAR(20) DEFAULT 'number',
  unit        VARCHAR(50),
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_benefits_sort_order ON benefits(sort_order);

-- 验证
SELECT 'benefits 表创建成功' as status;

-- ==========================================
-- 步骤 3：创建会员等级表 member_levels
-- ==========================================
CREATE TABLE IF NOT EXISTS member_levels (
  id            VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  description   VARCHAR(255),
  icon          VARCHAR(10),
  is_default    BOOLEAN DEFAULT FALSE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_member_levels_sort_order ON member_levels(sort_order);
CREATE INDEX IF NOT EXISTS idx_member_levels_is_default ON member_levels(is_default);

-- 验证
SELECT 'member_levels 表创建成功' as status;

-- ==========================================
-- 步骤 4：创建等级权益关联表 level_benefits
-- ==========================================
CREATE TABLE IF NOT EXISTS level_benefits (
  id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id    VARCHAR(36) NOT NULL REFERENCES member_levels(id) ON DELETE CASCADE,
  benefit_id  VARCHAR(36) NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  value       VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(level_id, benefit_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_level_benefits_level_id ON level_benefits(level_id);
CREATE INDEX IF NOT EXISTS idx_level_benefits_benefit_id ON level_benefits(benefit_id);

-- 验证
SELECT 'level_benefits 表创建成功' as status;

-- ==========================================
-- 步骤 5：插入默认权益数据（防重复）
-- ==========================================
INSERT INTO benefits (name, description, value_type, unit, sort_order) VALUES
('每日推送次数', '每日可接收推送通知的次数上限', 'number', '次/天', 1),
('积分获取倍率', '完成任务获得积分时的加成倍率', 'number', '倍', 2)
ON CONFLICT DO NOTHING;

-- 验证权益数据
SELECT id, name, value_type, unit FROM benefits;

-- ==========================================
-- 步骤 6：插入默认等级数据（防重复）
-- ==========================================
INSERT INTO member_levels (code, name, description, icon, is_default, sort_order) VALUES
('basic', '普通会员', '基础会员权益', '⭐', TRUE, 1),
('advanced', '高级会员', '高级会员权益', '💎', FALSE, 2),
('professional', '专业会员', '专业会员权益', '👑', FALSE, 3)
ON CONFLICT (code) DO NOTHING;

-- 验证等级数据
SELECT id, code, name, icon, is_default FROM member_levels;

-- ==========================================
-- 步骤 7：插入默认权益配置（防重复）
-- ==========================================

-- basic 等级权益配置
INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '3'
FROM member_levels ml, benefits b
WHERE ml.code = 'basic' AND b.name = '每日推送次数'
ON CONFLICT (level_id, benefit_id) DO NOTHING;

INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '1.0'
FROM member_levels ml, benefits b
WHERE ml.code = 'basic' AND b.name = '积分获取倍率'
ON CONFLICT (level_id, benefit_id) DO NOTHING;

-- advanced 等级权益配置
INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '10'
FROM member_levels ml, benefits b
WHERE ml.code = 'advanced' AND b.name = '每日推送次数'
ON CONFLICT (level_id, benefit_id) DO NOTHING;

INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '1.2'
FROM member_levels ml, benefits b
WHERE ml.code = 'advanced' AND b.name = '积分获取倍率'
ON CONFLICT (level_id, benefit_id) DO NOTHING;

-- professional 等级权益配置
INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '20'
FROM member_levels ml, benefits b
WHERE ml.code = 'professional' AND b.name = '每日推送次数'
ON CONFLICT (level_id, benefit_id) DO NOTHING;

INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '1.5'
FROM member_levels ml, benefits b
WHERE ml.code = 'professional' AND b.name = '积分获取倍率'
ON CONFLICT (level_id, benefit_id) DO NOTHING;

-- 验证权益配置数据
SELECT 
  ml.name as level_name,
  b.name as benefit_name,
  lb.value
FROM level_benefits lb
JOIN member_levels ml ON lb.level_id = ml.id
JOIN benefits b ON lb.benefit_id = b.id
ORDER BY ml.sort_order, b.sort_order;

-- ==========================================
-- 步骤 8：最终验证
-- ==========================================
SELECT 
  'benefits' as table_name, COUNT(*) as count FROM benefits
UNION ALL
SELECT 'member_levels', COUNT(*) FROM member_levels
UNION ALL
SELECT 'level_benefits', COUNT(*) FROM level_benefits;

-- ============================================
-- 步骤 9：删除旧表（确认新系统正常后执行）
-- 注意：只有确认新表数据正确后才执行此步骤
-- ============================================
-- DROP TABLE IF EXISTS membership_benefits;

-- ============================================
-- 部署完成说明
-- ============================================
-- 新表结构：
--   benefits: 权益项管理（2 条默认数据）
--   member_levels: 会员等级管理（3 条默认数据）
--   level_benefits: 等级权益关联（6 条默认数据）
--
-- 删除旧表：
--   执行步骤 9 的 DROP TABLE 命令（手动执行）
--   或在管理后台确认功能正常后再删除
-- ============================================