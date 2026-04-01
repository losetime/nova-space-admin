-- 修复 KeepTrack 同步错误
-- 执行日期: 2026-04-01
-- 问题: objectClass, color 字段超长导致同步失败

-- objectClass: 卫星对象类型描述，实测最大 29 字符（如 "Rocket Mission Related Object"）
-- 从 varchar(20) 扩大到 varchar(50)
ALTER TABLE satellite_metadata
  ALTER COLUMN "objectClass" TYPE VARCHAR(50);

-- color: 卫星外观颜色描述，实测最大 22 字符（如 "Silver (aluminum-clad)"）
-- 从 varchar(20) 扩大到 varchar(100)
ALTER TABLE satellite_metadata
  ALTER COLUMN color TYPE VARCHAR(100);