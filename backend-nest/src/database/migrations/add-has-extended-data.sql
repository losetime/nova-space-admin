-- 添加 hasExtendedData 字段到 satellite_metadata 表
ALTER TABLE satellite_metadata
  ADD COLUMN IF NOT EXISTS has_extended_data BOOLEAN NOT NULL DEFAULT false;

-- 注意：现有数据的 has_extended_data 会被设置为 false
-- 当 KeepTrack 元数据同步完成后会自动标记为 true
