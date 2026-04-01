-- 更新 satellite_metadata 表中 lifetime 字段的类型
-- 从 VARCHAR(50) 改为 TEXT，以存储 KeepTrack 返回的较长寿命描述
-- 执行时间：2026-04-01
--
-- KeepTrack 的 LIFETIME 字段可能包含多行描述，如：
-- "15 years design life.\nStill operational as of March 2026, exceeding 27 years on orbit.\nFGB propulsion system life extended to 2028 via comprehensive test campaign."
-- 此示例值长达 144 字符，远超 VARCHAR(50) 的限制

ALTER TABLE satellite_metadata
ALTER COLUMN lifetime TYPE TEXT;