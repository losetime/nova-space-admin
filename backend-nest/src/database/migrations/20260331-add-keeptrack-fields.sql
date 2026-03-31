-- 添加 KeepTrack 缺失字段到 satellite_metadata 表
-- 执行日期: 2026-03-31

-- 基础标识字段
ALTER TABLE satellite_metadata
  ADD COLUMN IF NOT EXISTS alt_name VARCHAR(100);

-- 发射信息字段
ALTER TABLE satellite_metadata
  ADD COLUMN IF NOT EXISTS stable_date DATE,
  ADD COLUMN IF NOT EXISTS launch_pad VARCHAR(50);

-- 制造商字段
ALTER TABLE satellite_metadata
  ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);

-- 设计信息字段
ALTER TABLE satellite_metadata
  ADD COLUMN IF NOT EXISTS configuration VARCHAR(100);

-- 技术规格字段
ALTER TABLE satellite_metadata
  ADD COLUMN IF NOT EXISTS power TEXT,
  ADD COLUMN IF NOT EXISTS motor TEXT;

-- 扩展信息字段
ALTER TABLE satellite_metadata
  ADD COLUMN IF NOT EXISTS color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS material_composition TEXT,
  ADD COLUMN IF NOT EXISTS major_events TEXT,
  ADD COLUMN IF NOT EXISTS related_satellites TEXT,
  ADD COLUMN IF NOT EXISTS transmitter_frequencies TEXT,
  ADD COLUMN IF NOT EXISTS sources TEXT,
  ADD COLUMN IF NOT EXISTS reference_urls TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS anomaly_flags VARCHAR(50),
  ADD COLUMN IF NOT EXISTS last_reviewed TIMESTAMP;

-- 添加注释说明各字段用途
COMMENT ON COLUMN satellite_metadata.alt_name IS '卫星别名/代号';
COMMENT ON COLUMN satellite_metadata.stable_date IS '入轨稳定日期';
COMMENT ON COLUMN satellite_metadata.launch_pad IS '发射工位';
COMMENT ON COLUMN satellite_metadata.manufacturer IS '制造商（与 contractor 区分）';
COMMENT ON COLUMN satellite_metadata.configuration IS '配置型号';
COMMENT ON COLUMN satellite_metadata.power IS '电源系统描述';
COMMENT ON COLUMN satellite_metadata.motor IS '推进系统描述';
COMMENT ON COLUMN satellite_metadata.color IS '外观颜色';
COMMENT ON COLUMN satellite_metadata.material_composition IS '材料构成';
COMMENT ON COLUMN satellite_metadata.major_events IS '重大事件历史';
COMMENT ON COLUMN satellite_metadata.related_satellites IS '相关卫星';
COMMENT ON COLUMN satellite_metadata.transmitter_frequencies IS '发射频率';
COMMENT ON COLUMN satellite_metadata.sources IS '数据来源链接';
COMMENT ON COLUMN satellite_metadata.reference_urls IS '参考链接';
COMMENT ON COLUMN satellite_metadata.summary IS '详细描述文本';
COMMENT ON COLUMN satellite_metadata.anomaly_flags IS '异常标记';
COMMENT ON COLUMN satellite_metadata.last_reviewed IS '最后审核日期';