-- ============================================================
-- 星瞰 Admin 部署数据库升级脚本（自愈版，可在脏数据的线上库直接执行）
-- 前置：已具备 0000_initial_schema.sql 基线（含 satellite_sync_tasks /
--       satellite_sync_error_logs / satellite_metadata / satellite_tle 表）
-- 执行：psql -h <host> -p 5432 -U postgres -d nova_space -f db-migrations.sql
-- 特性：幂等可重复执行；不再要求手工前置条件
-- ============================================================

BEGIN;

-- ---------- 0001a: 回填 satellite_metadata.name（只补空值，不覆盖已有数据） ----------
-- 优先级：TLE 名称 > alt_name > object_id > cospar_id > Unknown-<norad_id>
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

-- ---------- 0001b: 删除孤儿 TLE（无对应 metadata，否则外键无法建立） ----------
DELETE FROM satellite_tle t
WHERE NOT EXISTS (
  SELECT 1 FROM satellite_metadata m WHERE m.norad_id = t.norad_id
);

-- ---------- 0001c: 建立外键（幂等；NOT VALID + VALIDATE 缩短加锁时间） ----------
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

-- ---------- 0002: 同步任务跳过统计 + 清理历史错误噪音 ----------
ALTER TABLE satellite_sync_tasks
  ADD COLUMN IF NOT EXISTS skipped integer NOT NULL DEFAULT 0;

DELETE FROM satellite_sync_error_logs
  WHERE error_type IN ('duplicate', 'rate_limit');

COMMIT;

-- ============================================================
-- 校验与说明
-- ============================================================
-- ① 剩余孤儿 TLE（应为 0）：
--      SELECT count(*) FROM satellite_tle t
--      WHERE NOT EXISTS (SELECT 1 FROM satellite_metadata m WHERE m.norad_id=t.norad_id);
--
-- ② 无 TLE 的 metadata 数量（仅报告，不删除）：
--      外键只约束 TLE→metadata，metadata 可以没有 TLE，不影响外键建立。
--      如线上确实要求严格 1:1，可手动执行（会删除这些卫星信息，请谨慎）：
--      DELETE FROM satellite_metadata m
--      WHERE NOT EXISTS (SELECT 1 FROM satellite_tle t WHERE t.norad_id=m.norad_id);
--
-- ③ 空 name（应为 0）：
--      SELECT count(*) FROM satellite_metadata WHERE name IS NULL OR name='';
--
-- ④ skipped 列存在性：
--      SELECT column_name FROM information_schema.columns
--      WHERE table_name='satellite_sync_tasks' AND column_name='skipped';
--
-- 注意：
--   - 0002 的 DELETE 会清掉线上 duplicate/rate_limit 历史噪音（原语义下约 4 万行）。
--   - 0001b 会删除孤儿 TLE 行（无 metadata 归属，新模型下为垃圾数据）。
--   - 脚本整体在事务内，任一步失败自动回滚。
