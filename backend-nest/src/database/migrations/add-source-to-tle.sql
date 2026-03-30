-- 添加 source 字段到 satellite_tle 表
ALTER TABLE satellite_tle
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'celestrak';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_satellite_tle_source ON satellite_tle(source);

-- 注意：现有数据的 source 会被设置为默认值 'celestrak'
-- 如果需要标记为 'space-track'，请根据实际情况更新
-- UPDATE satellite_tle SET source = 'space-track' WHERE ...;
