--
-- 0002_error_semantics_refactor
--
-- 目标：
--   1. satellite_sync_tasks 增加 skipped 计数列，用于统计“跳过/重复/限流”等非失败项
--   2. 清理历史错误日志中的噪音类型（duplicate=重复跳过，rate_limit=可恢复限流），
--      这两类不再是“错误”，不再写入 satellite_sync_error_logs
--

ALTER TABLE satellite_sync_tasks
  ADD COLUMN IF NOT EXISTS skipped integer NOT NULL DEFAULT 0;

DELETE FROM satellite_sync_error_logs
  WHERE error_type IN ('duplicate', 'rate_limit');
