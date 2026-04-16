-- ============================================
-- 会员权益系统重构迁移
-- ============================================

-- 1. 创建权益表
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

-- 2. 创建会员等级表
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

-- 3. 创建等级权益关联表
CREATE TABLE IF NOT EXISTS level_benefits (
  id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id    VARCHAR(36) NOT NULL REFERENCES member_levels(id) ON DELETE CASCADE,
  benefit_id  VARCHAR(36) NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  value       VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(level_id, benefit_id)
);

-- 4. 插入默认权益数据
INSERT INTO benefits (name, description, value_type, unit, sort_order) VALUES
('每日推送次数', '每日可接收推送通知的次数上限', 'number', '次/天', 1),
('积分获取倍率', '完成任务获得积分时的加成倍率', 'number', '倍', 2);

-- 5. 插入默认等级数据
INSERT INTO member_levels (code, name, description, icon, is_default, sort_order) VALUES
('basic', '普通会员', '基础会员权益', '⭐', TRUE, 1),
('advanced', '高级会员', '高级会员权益', '💎', FALSE, 2),
('professional', '专业会员', '专业会员权益', '👑', FALSE, 3);

-- 6. 插入默认权益配置
-- basic 等级权益
INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '3'
FROM member_levels ml, benefits b
WHERE ml.code = 'basic' AND b.name = '每日推送次数';

INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '1.0'
FROM member_levels ml, benefits b
WHERE ml.code = 'basic' AND b.name = '积分获取倍率';

-- advanced 等级权益
INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '10'
FROM member_levels ml, benefits b
WHERE ml.code = 'advanced' AND b.name = '每日推送次数';

INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '1.2'
FROM member_levels ml, benefits b
WHERE ml.code = 'advanced' AND b.name = '积分获取倍率';

-- professional 等级权益
INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '20'
FROM member_levels ml, benefits b
WHERE ml.code = 'professional' AND b.name = '每日推送次数';

INSERT INTO level_benefits (level_id, benefit_id, value)
SELECT ml.id, b.id, '1.5'
FROM member_levels ml, benefits b
WHERE ml.code = 'professional' AND b.name = '积分获取倍率';

-- 7. 删除旧权益表
DROP TABLE IF EXISTS membership_benefits;

-- ============================================
-- 迁移完成说明
-- ============================================
-- 新表结构：
-- - benefits: 权益项管理（独立于等级）
-- - member_levels: 会员等级管理（可自定义新增）
-- - level_benefits: 等级权益关联（配置具体值）
--
-- 默认数据：
-- - 2个权益：每日推送次数、积分获取倍率
-- - 3个等级：普通会员（默认）、高级会员、专业会员
-- - 6条权益配置：每个等级配置2个权益
-- ============================================