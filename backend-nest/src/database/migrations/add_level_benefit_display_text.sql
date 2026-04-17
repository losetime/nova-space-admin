-- 添加 level_benefits 表的 display_text 字段
-- 用于存储权益配置的展示文案（给用户看的）
-- value 字段用于控制逻辑

ALTER TABLE level_benefits ADD COLUMN IF NOT EXISTS display_text VARCHAR(255);

COMMENT ON COLUMN level_benefits.display_text IS '权益配置展示文案，用于页面展示给用户';