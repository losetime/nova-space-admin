-- 添加 Space-Track 元数据标记字段并重命名 hasExtendedData
-- 执行日期: 2026-03-31

-- 1. 新增 hasSpaceTrackData 字段
ALTER TABLE satellite_metadata
  ADD COLUMN IF NOT EXISTS "hasSpaceTrackData" BOOLEAN NOT NULL DEFAULT false;

-- 2. 重命名 hasExtendedData 为 hasKeepTrackData
ALTER TABLE satellite_metadata
  RENAME COLUMN "hasExtendedData" TO "hasKeepTrackData";

-- 3. 添加字段注释
COMMENT ON COLUMN satellite_metadata."hasSpaceTrackData" IS '是否有 Space-Track 元数据';
COMMENT ON COLUMN satellite_metadata."hasKeepTrackData" IS '是否有 KeepTrack 扩展元数据';

-- 注意：hasSpaceTrackData 初始值为 false，需要通过 Space-Track 元数据同步来设置
-- 不要通过 objectId 推断，因为 KeepTrack 同步也会填充 objectId