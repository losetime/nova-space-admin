--
-- 0001_add_satellite_tle_fk
--
-- 目标：强制 satellite_tle 与 satellite_metadata 一一对应（无孤儿行）。
-- 背景：keepTrack 为主数据源（唯一允许创建记录的来源），space-track / discos / celestrak 仅做补充更新。
--
-- 说明（自愈版）：前置条件不再要求手工处理，脚本自行完成：
--   1. 回填 satellite_metadata.name（TLE 名称 / alt_name / object_id / cospar_id 兜底）
--   2. 删除无对应 metadata 的孤儿 TLE
--   3. 建立外键（幂等；NOT VALID + VALIDATE 缩短加锁时间）
--

-- 1. 回填 metadata.name（只补空值）
UPDATE satellite_metadata m
SET name = COALESCE(
  NULLIF(m.name, ''),
  (SELECT NULLIF(t.name, '') FROM satellite_tle t WHERE t.norad_id = m.norad_id LIMIT 1),
  NULLIF(m.alt_name, ''),
  NULLIF(m.object_id, ''),
  NULLIF(m.cospar_id, ''),
  CONCAT('Unknown-', m.norad_id)
)
WHERE m.name IS NULL OR m.name = '';

-- 2. 删除孤儿 TLE（无 metadata 归属）
DELETE FROM satellite_tle t
WHERE NOT EXISTS (
  SELECT 1 FROM satellite_metadata m WHERE m.norad_id = t.norad_id
);

-- 3. 建立外键（幂等）；metadata 删除时级联删除其 TLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'satellite_tle_norad_id_fkey'
      AND conrelid = 'satellite_tle'::regclass
  ) THEN
    ALTER TABLE satellite_tle
      ADD CONSTRAINT satellite_tle_norad_id_fkey
      FOREIGN KEY (norad_id) REFERENCES satellite_metadata(norad_id)
      ON DELETE CASCADE
      NOT VALID;
    ALTER TABLE satellite_tle VALIDATE CONSTRAINT satellite_tle_norad_id_fkey;
  END IF;
END $$;
