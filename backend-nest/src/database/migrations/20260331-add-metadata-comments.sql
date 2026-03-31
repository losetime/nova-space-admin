-- 为 satellite_metadata 表的所有字段添加注释
-- 执行日期: 2026-03-31
-- 注意：PostgreSQL 字段名区分大小写，需要用双引号

-- 基础标识字段
COMMENT ON COLUMN satellite_metadata."noradId" IS 'NORAD 卫星编号（主键，5位数字字符串）';
COMMENT ON COLUMN satellite_metadata."name" IS '卫星名称';
COMMENT ON COLUMN satellite_metadata."objectId" IS '国际编号/宇宙编号（如 1998-067A）';
COMMENT ON COLUMN satellite_metadata."altNames" IS '别名列表（数组格式）';
COMMENT ON COLUMN satellite_metadata."alt_name" IS '卫星别名/代号（单个别名）';

-- 物体类型与状态
COMMENT ON COLUMN satellite_metadata."objectType" IS '物体类型：PAYLOAD（载荷）、ROCKET_BODY（火箭体）、DEBRIS（碎片）等';
COMMENT ON COLUMN satellite_metadata."status" IS '运行状态：+（正常）、P（部分正常）、B（备份）、S（储备）、X（非功能）、D（已衰变）';
COMMENT ON COLUMN satellite_metadata."rcs" IS '雷达散射截面（RCS），数值或描述（Small/Medium/Large）';
COMMENT ON COLUMN satellite_metadata."stdMag" IS '标准星等/视星等（可见光亮度）';

-- 国家信息
COMMENT ON COLUMN satellite_metadata."countryCode" IS '国家/组织代码（如 US、CN、RU、ESA）';

-- 发射信息
COMMENT ON COLUMN satellite_metadata."launchDate" IS '发射日期';
COMMENT ON COLUMN satellite_metadata."stable_date" IS '入轨稳定日期';
COMMENT ON COLUMN satellite_metadata."launchSite" IS '发射场代码（如 AFETR、TTMTR）';
COMMENT ON COLUMN satellite_metadata."launchSiteName" IS '发射场名称（如 Baikonur Cosmodrome）';
COMMENT ON COLUMN satellite_metadata."launch_pad" IS '发射工位（如 LC81/23）';
COMMENT ON COLUMN satellite_metadata."launchVehicle" IS '发射载具/火箭型号（如 Proton-K）';
COMMENT ON COLUMN satellite_metadata."flightNo" IS '发射飞行编号';
COMMENT ON COLUMN satellite_metadata."cosparLaunchNo" IS 'COSPAR 发射编号';
COMMENT ON COLUMN satellite_metadata."launchFailure" IS '发射是否失败';
COMMENT ON COLUMN satellite_metadata."decayDate" IS '衰变/再入大气层日期';
COMMENT ON COLUMN satellite_metadata."predDecayDate" IS '预测衰变日期';
COMMENT ON COLUMN satellite_metadata."lifetime" IS '设计寿命（如 "15 years"）';

-- 轨道参数
COMMENT ON COLUMN satellite_metadata."period" IS '轨道周期（分钟）';
COMMENT ON COLUMN satellite_metadata."inclination" IS '轨道倾角（度）';
COMMENT ON COLUMN satellite_metadata."apogee" IS '远地点高度';
COMMENT ON COLUMN satellite_metadata."perigee" IS '近地点高度';
COMMENT ON COLUMN satellite_metadata."eccentricity" IS '轨道偏心率';
COMMENT ON COLUMN satellite_metadata."raan" IS '升交点赤经（度）';
COMMENT ON COLUMN satellite_metadata."argOfPerigee" IS '近地点幅角（度）';

-- TLE 信息
COMMENT ON COLUMN satellite_metadata."tleEpoch" IS 'TLE 数据历元时间';
COMMENT ON COLUMN satellite_metadata."tleAge" IS 'TLE 数据年龄（天数）';

-- ESA DISCOS 扩展字段
COMMENT ON COLUMN satellite_metadata."cosparId" IS 'COSPAR 国际编号（ESA DISCOS）';
COMMENT ON COLUMN satellite_metadata."objectClass" IS '物体分类（ESA DISCOS）：Payload、Rocket Body、Debris 等';
COMMENT ON COLUMN satellite_metadata."launchMass" IS '发射时质量';
COMMENT ON COLUMN satellite_metadata."dryMass" IS '干质量（不含燃料）';
COMMENT ON COLUMN satellite_metadata."shape" IS '形状描述（如 Cyl + 2 Pan）';
COMMENT ON COLUMN satellite_metadata."dimensions" IS '尺寸描述（如 10m × 5m × 3m）';
COMMENT ON COLUMN satellite_metadata."span" IS '翼展/跨度';
COMMENT ON COLUMN satellite_metadata."length" IS '长度';
COMMENT ON COLUMN satellite_metadata."diameter" IS '直径';
COMMENT ON COLUMN satellite_metadata."firstEpoch" IS '首次轨道历元时间（ESA DISCOS）';

-- 制造商与运营商
COMMENT ON COLUMN satellite_metadata."operator" IS '运营商/拥有者（如 NASA、ESA）';
COMMENT ON COLUMN satellite_metadata."manufacturer" IS '制造商（如 Boeing、Lockheed Martin）';
COMMENT ON COLUMN satellite_metadata."contractor" IS '承包商/合同方';

-- 任务信息
COMMENT ON COLUMN satellite_metadata."mission" IS '任务名称/类型';
COMMENT ON COLUMN satellite_metadata."purpose" IS '任务用途描述';
COMMENT ON COLUMN satellite_metadata."payload" IS '载荷描述';
COMMENT ON COLUMN satellite_metadata."equipment" IS '设备载荷描述';
COMMENT ON COLUMN satellite_metadata."constellationName" IS '星座名称（如 Starlink、OneWeb）';

-- 设计信息
COMMENT ON COLUMN satellite_metadata."bus" IS '卫星平台型号（如 77KS、Star-2）';
COMMENT ON COLUMN satellite_metadata."configuration" IS '配置型号';
COMMENT ON COLUMN satellite_metadata."platform" IS '平台类型';

-- 技术规格
COMMENT ON COLUMN satellite_metadata."power" IS '电源系统描述（如太阳能板、电池）';
COMMENT ON COLUMN satellite_metadata."motor" IS '推进系统描述（如发动机、推进器）';
COMMENT ON COLUMN satellite_metadata."adcs" IS '姿态控制系统（ADCS）描述';

-- 扩展信息
COMMENT ON COLUMN satellite_metadata."color" IS '外观颜色';
COMMENT ON COLUMN satellite_metadata."material_composition" IS '材料构成描述';
COMMENT ON COLUMN satellite_metadata."major_events" IS '重大事件历史（发射、对接、故障等）';
COMMENT ON COLUMN satellite_metadata."related_satellites" IS '相关卫星信息（如 ISS 各模块关联）';
COMMENT ON COLUMN satellite_metadata."transmitter_frequencies" IS '发射频率信息';

-- 数据来源与审核
COMMENT ON COLUMN satellite_metadata."sources" IS '数据来源链接';
COMMENT ON COLUMN satellite_metadata."reference_urls" IS '参考链接';
COMMENT ON COLUMN satellite_metadata."summary" IS '详细描述/概述文本';
COMMENT ON COLUMN satellite_metadata."anomaly_flags" IS '异常标记';
COMMENT ON COLUMN satellite_metadata."last_reviewed" IS '数据最后审核日期';

-- 数据标记
COMMENT ON COLUMN satellite_metadata."hasDiscosData" IS '是否有 ESA DISCOS 扩展数据';
COMMENT ON COLUMN satellite_metadata."hasExtendedData" IS '是否有 KeepTrack 扩展元数据';

-- 系统字段
COMMENT ON COLUMN satellite_metadata."createdAt" IS '记录创建时间';
COMMENT ON COLUMN satellite_metadata."updatedAt" IS '记录更新时间';